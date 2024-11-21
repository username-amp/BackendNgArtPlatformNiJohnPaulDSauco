const Notification = require("../models/Notifications");
const Post = require("../models/Post");
const User = require("../models/User");

const likePost = async (req, res) => {
  const { postId, authorId, recipientId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await Post.findByIdAndUpdate(postId, { $inc: { likes_count: 1 } });

    const notification = new Notification({
      recipient: recipientId,
      author: authorId,
      type: "like",
      post: postId,
    });

    await notification.save();

    res.status(200).json({
      message: "Post liked and notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error in like route:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

const commentPost = async (req, res) => {
  const { postId, authorId, recipientId, commentContent } = req.body;

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

    const notification = new Notification({
      recipient: recipientId,
      author: authorId,
      type: "comment",
      post: postId,
    });

    await notification.save();

    res.status(200).json({
      message: "Comment added and notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error in comment route:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

const savePost = async (req, res, next) => {
  try {
    const { userId, postId } = req.body;

    if (!userId || !postId) {
      return res
        .status(400)
        .json({ message: "Both userId and postId are required" });
    }

    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!post) return res.status(404).json({ message: "Post not found" });

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

    res.status(200).json({
      message: "Post saved and notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error in savePost:", error.message);
    next(error);
  }
};

module.exports = { likePost, commentPost, savePost };
