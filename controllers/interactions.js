const Notification = require("../models/Notifications");
const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");

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

    post.likes.push({ user_id: authorId });
    post.likes_count += 1;
    await post.save();

    await Notification.create({
      recipient: authorId,
      author: recipientId,
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

    const notification = await Notification.findOneAndDelete({
      recipient: authorId,
      author: recipientId,
      type: "like",
      post: postId,
    });

    if (!notification) {
      console.log("No like notification found to delete.");
    }

    post.likes = post.likes.filter(
      (like) => like.user_id.toString() !== recipientId
    );
    post.likes_count -= 1;
    await post.save();

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
  const { postId, commentContent } = req.body;
  const authorId = req.user._id;
  const recipientId = req.body.recipientId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { comments_count: 1 },
        $push: { comments: { user_id: authorId, content: commentContent } },
      },
      { new: true }
    );

    const author = await User.findById(authorId);
    const recipient = recipientId ? await User.findById(recipientId) : null;

    const notification = new Notification({
      recipient: recipientId,
      author: authorId,
      type: "comment",
      post: postId,
    });

    await notification.save();

    res.status(200).json({
      message: "Comment added and notification created successfully",
      notification: {
        ...notification.toObject(),
        authorUsername: author.username,
        recipientUsername: recipient ? recipient.username : null,
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

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedPosts: postId } },
      { new: true }
    );

    const updatedUser = await User.findById(userId);
    console.log(updatedUser.savedPosts);

    const notification = new Notification({
      recipient: post.author_id,
      author: userId,
      type: "save",
      post: postId,
    });

    await notification.save();

    res.status(200).json({
      message: "Post saved and notification created successfully",
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


module.exports = { getComments, likePost, commentPost, savePost, unlikePost, getLikedPosts, followUser, unfollowUser };
