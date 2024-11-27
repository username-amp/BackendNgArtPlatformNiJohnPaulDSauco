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

    post.likes.push({ user_id: recipientId });
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

module.exports = { getComments, likePost, commentPost, savePost, unlikePost };
