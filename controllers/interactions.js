const Notification = require("../models/Notifications");
const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const { getIO } = require("../socket");
const Like = require("../models/Like");
const SaveStatus = require("../models/Save");
const Follow = require("../models/Follow");

const likePost = async (req, res) => {
  try {
    const { authorId, recipientId, postId } = req.body;

    if (
      ![authorId, recipientId, postId].every(mongoose.Types.ObjectId.isValid)
    ) {
      return res.status(400).json({
        error: "Invalid ID format. Ensure IDs are valid MongoDB ObjectIds.",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    let like = await Like.findOne({ user_id: authorId, post_id: postId });

    if (like) {
      if (like.status === true) {
        return res
          .status(400)
          .json({ message: "You've already liked this post." });
      }

      like.status = true;
      await like.save();
    } else {
      like = new Like({ user_id: authorId, post_id: postId, status: true });
      await like.save();
    }

    post.likes_count += 1;
    post.likes.push({ user_id: authorId });
    await post.save();

    await Notification.create({
      recipient: recipientId,
      author: authorId,
      type: "like",
      post: postId,
    });

    res.status(200).json({
      message: "Post liked successfully.",
      likes_count: post.likes_count,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the request." });
  }
};

const unlikePost = async (req, res) => {
  try {
    const { authorId, recipientId, postId } = req.body;

    if (
      ![authorId, recipientId, postId].every(mongoose.Types.ObjectId.isValid)
    ) {
      return res.status(400).json({
        error: "Invalid ID format. Ensure IDs are valid MongoDB ObjectIds.",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const like = await Like.findOne({ user_id: authorId, post_id: postId });
    if (!like || like.status === false) {
      return res
        .status(400)
        .json({ message: "You haven't liked this post yet." });
    }

    like.status = false;
    await like.save();

    post.likes_count -= 1;
    post.likes = post.likes.filter(
      (like) => like.user_id.toString() !== authorId
    );
    await post.save();

    await Notification.findOneAndDelete({
      recipient: recipientId,
      author: authorId,
      type: "like",
      post: postId,
    });

    res.status(200).json({
      message: "Post unliked successfully.",
      likes_count: post.likes_count,
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the request." });
  }
};

const commentPost = async (req, res) => {
  const { postId, commentContent, recipientId } = req.body;
  const authorId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { comments_count: 1 },
        $push: { comments: { user_id: authorId, content: commentContent } },
      },
      { new: true }
    ).populate({
      path: "comments.user_id",
    });

    const author = await User.findById(authorId);
    const recipient = recipientId ? await User.findById(recipientId) : null;

    const notification = new Notification({
      recipient: recipientId,
      author: authorId,
      type: "comment",
      post: postId,
    });
    await notification.save();

    const io = getIO();
    io.emit("newComment", {
      postId,
      comment: {
        user_id: authorId,
        username: author.username,
        content: commentContent,
      },
    });

    res.status(200).json({
      message: "Comment added successfully",
      notification: {
        ...notification.toObject(),
        authorUsername: author.username,
        recipientUsername: recipient ? recipient.username : null,
      },
      comment: {
        user_id: authorId,
        username: author.username,
        content: commentContent,
      },
    });
  } catch (error) {
    console.error("Error in comment route:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

const savePost = async (req, res, next) => {
  try {
    const { postId } = req.body;
    const userId = req.user._id;

    if (!userId || !postId) {
      return res
        .status(400)
        .json({ message: "Both userId and postId are required" });
    }

    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (userId === post.author_id) {
      return res.status(400).json({ message: "Cannot save your own post" });
    }

    const existingSaveStatus = await SaveStatus.findOne({
      user_id: userId,
      post_id: postId,
    });

    if (existingSaveStatus && existingSaveStatus.status === true) {
      return res
        .status(400)
        .json({ message: "You've already saved this post" });
    }

    await SaveStatus.findOneAndUpdate(
      { user_id: userId, post_id: postId },
      { status: true },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedPosts: postId } },
      { new: true }
    );

    const notification = new Notification({
      recipient: post.author_id,
      author: userId,
      type: "save",
      post: postId,
    });

    await notification.save();

    const updatedUser = await User.findById(userId).populate("savedPosts");

    res.status(200).json({
      message: "Post saved and notification created successfully",
      savedPosts: updatedUser.savedPosts,
      notification,
    });
  } catch (error) {
    console.error("Error in savePost:", error.message);
    next(error);
  }
};

const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate({
      path: "comments.user_id",
      select: "username",
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const populatedComments = post.comments.map((comment) => ({
      ...comment._doc,
      authorUsername: comment.user_id?.username || "Unknown",
    }));

    res.status(200).json({
      comments: populatedComments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching comments." });
  }
};

const editComment = async (req, res) => {
  const { postId, commentId, newContent } = req.body;
  const authorId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user_id.toString() !== authorId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    comment.content = newContent;
    await post.save();

    res.status(200).json({
      message: "Comment updated successfully",
      comment: comment,
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the comment" });
  }
};

const deleteComment = async (req, res) => {
  const { postId, commentId } = req.body;
  const authorId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user_id.toString() !== authorId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this comment" });
    }

    post.comments.pull(commentId);
    post.comments_count -= 1;

    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the comment" });
  }
};

const getLikedPosts = async (req, res) => {
  const userId = req.user._id;

  try {
    const posts = await Post.find({ "likes.user_id": userId })
      .populate("author_id", "username profile_picture")
      .exec();

    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const followUser = async (req, res) => {
  try {
    const { authorId } = req.params;
    const userId = req.user._id;

    if (![authorId, userId].every(mongoose.Types.ObjectId.isValid)) {
      return res.status(400).json({ error: "Invalid user IDs" });
    }

    if (authorId === userId.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(authorId);
    const currentUser = await User.findById(userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let follow = await Follow.findOne({
      follower: userId,
      following: authorId,
    });

    if (follow) {
      follow.status = true;
      await follow.save();
    } else {
      follow = new Follow({
        follower: userId,
        following: authorId,
        status: true,
      });
      await follow.save();
    }

    userToFollow.followers.addToSet(userId);
    currentUser.following.addToSet(authorId);

    await userToFollow.save();
    await currentUser.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: "An error occurred while following user" });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { authorId } = req.params;
    const userId = req.user._id;

    if (![authorId, userId].every(mongoose.Types.ObjectId.isValid)) {
      return res.status(400).json({ error: "Invalid user IDs" });
    }

    if (authorId === userId.toString()) {
      return res.status(400).json({ error: "You cannot unfollow yourself" });
    }

    const userToUnfollow = await User.findById(authorId);
    const currentUser = await User.findById(userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const follow = await Follow.findOne({
      follower: userId,
      following: authorId,
    });

    if (follow) {
      follow.status = false;
      await follow.save();
    }

    userToUnfollow.followers.pull(userId);
    currentUser.following.pull(authorId);

    await userToUnfollow.save();
    await currentUser.save();

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res
      .status(500)
      .json({ message: "An error occurred while unfollowing user" });
  }
};

const getSavedStatus = async (req, res) => {
  try {
    const { postId, userId } = req.query;
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const saveStatus = await SaveStatus.findOne({
      user_id: userId,
      post_id: postId,
    });

    const isSaved = saveStatus ? saveStatus.status : false;

    res.status(200).json({ isSaved });
  } catch (error) {
    console.error("Error fetching saved status:", error);
    res.status(500).json({ message: "Failed to fetch saved status" });
  }
};

const checkFollowStatus = async (req, res) => {
  try {
    const { authorId } = req.params;
    const userId = req.user._id;

    const follow = await Follow.findOne({
      follower: userId,
      following: authorId,
    });

    if (!follow) {
      return res.status(200).json({ isFollowing: false });
    }

    return res.status(200).json({ isFollowing: follow.status });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res
      .status(500)
      .json({ message: "An error occurred while checking follow status" });
  }
};

module.exports = {
  getComments,
  likePost,
  commentPost,
  savePost,
  unlikePost,
  getLikedPosts,
  followUser,
  unfollowUser,
  editComment,
  deleteComment,
  getSavedStatus,
  checkFollowStatus,
};
