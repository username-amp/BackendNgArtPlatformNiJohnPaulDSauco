const mongoose = require("mongoose");
const Post = require("../models/Post");
const Category = require("../models/Category");
const User = require("../models/User");
const Notification = require("../models/Notifications");

const createPost = async (req, res, next) => {
  try {
    console.log("Received Author ID:", req.body.author_id);
    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    const { title, description, author_id, categoryTitle } = req.body;

    if (!mongoose.Types.ObjectId.isValid(author_id)) {
      return res.status(400).json({ message: "Invalid Author ID format" });
    }

    const author = await User.findById(author_id);
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    if (!req.files || !req.files.length) {
      return res
        .status(400)
        .json({ message: "At least one image must be uploaded" });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

    let category = await Category.findOne({ title: categoryTitle });
    if (!category) {
      category = new Category({ title: categoryTitle });
      await category.save();
    }

    const post = new Post({
      title,
      description,
      image_url: imageUrls,
      author_id,
      category: category._id,
    });

    await post.save();

    

    res.status(201).json({
      code: 201,
      status: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Error creating post:", error.message);
    next(error);
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("category", "title")
      .populate("author_id", "username");

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch posts", error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, description, categoryTitle } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      res.code = 404;
      throw new Error(`Post not found`);
    }

    if (title) post.title = title;
    if (description) post.description = description;

    if (categoryTitle) {
      let category = await Category.findOne({ title: categoryTitle });
      if (!category) {
        category = new Category({ title: categoryTitle });
        await category.save();
      }
      post.category = category._id;
    }

    if (req.files) {
      const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
      post.image_url = imageUrls;
    }

    await post.save();

    res.code = 200;
    res.json({ message: "Post updated successfully", post });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      res.code = 404;
      throw new Error(`Post not found`);
    }

    res.code = 200;
    res.json({ message: "Post deleted successfully", post });
  } catch (error) {
    next(error);
  }
};

const removeSavedPost = async (req, res, next) => {
  const { userId, postId } = req.body;

  try {

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    user.savedPosts = user.savedPosts || [];

   

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedPosts: postId } },
      { new: true }
    );

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const notification = await Notification.findOne({
      recipient: post.author_id,
      author: userId,
      type: "save",
      post: postId,
    });

    if (notification) {
      await notification.deleteOne();
      console.log("Notification deleted");
    }

    const populatedUser = await User.findById(userId).populate("savedPosts");

    res.status(200).json({
      message: "Post removed from saved successfully, and notification deleted",
      savedPosts: populatedUser.savedPosts,
    });
  } catch (error) {
    console.error("Error in removeSavedPost:", error.message);
    next(error);
  }
};





const getSavedPosts = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate("savedPosts");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Saved posts fetched successfully",
      savedPosts: user.savedPosts,
    });
  } catch (error) {
    console.error("Error fetching saved posts:", error.message);
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getSavedPosts,
  removeSavedPost,
};
