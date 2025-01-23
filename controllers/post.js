const mongoose = require("mongoose");
const Post = require("../models/Post");
const Category = require("../models/Category");
const User = require("../models/User");
const Notification = require("../models/Notifications");
const { getIO } = require("../socket");
const SaveStatus = require("../models/Save");
const { Types } = mongoose;

const createPost = async (req, res, next) => {
  try {
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
      author_id: author._id,
      username: author.username,
      category: category._id,
      categoryTitle: category.title,
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("author_id", "username")
      .populate("category", "title");

    const io = getIO();
    io.emit("newPost", populatedPost);

    res.status(201).json({
      code: 201,
      status: true,
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error.message);
    next(error);
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { search, filter } = req.query;

    console.log("Search Query:", search);

    let filterQuery = {};
    if (search) {
      filterQuery = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { categoryTitle: { $regex: search, $options: "i" } },
        ],
      };
    }

    let sortOption = {};
    if (filter === "recent") {
      sortOption = { createdAt: -1 };
    } else if (filter === "popular") {
      sortOption = { likes: -1 };
    }

    const posts = await Post.find(filterQuery)
      .populate("category", "title")
      .populate("author_id", "username")
      .sort(sortOption);
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error:", error);

    res
      .status(500)
      .json({ message: "Failed to fetch posts", error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "author_id",
      "username profile_picture"
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getPostWithLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "likes.user_id",
      "username profile_picture"
    );

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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedPosts: postId } },
      { new: true }
    );

    await SaveStatus.findOneAndUpdate(
      { user_id: userId, post_id: postId },
      { status: false },
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
    const user = await User.findById(userId).populate({
      path: "savedPosts",
      populate: {
        path: "author_id",
        select: "username",
      },
    });

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

const getRelatedPosts = async (req, res) => {
  const { categoryId } = req.params;

  try {
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const relatedPosts = await Post.find({ category: categoryId })
      .populate("author_id", "username profile_picture")
      .populate("category", "title")
      .limit(5)
      .sort({ createdAt: -1 });

    if (relatedPosts.length === 0) {
      return res.status(404).json({ message: "No related posts found" });
    }

    res.status(200).json({
      message: "Related posts fetched successfully",
      relatedPosts,
    });
  } catch (error) {
    console.error("Error fetching related posts:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserPostsCount = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(userId).select("username profile_picture");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ author_id: userId }).populate(
      "category",
      "title"
    );

    const postCount = posts.length;

    res.status(200).json({
      code: 200,
      status: true,
      user: {
        username: user.username,
        profile_picture: user.profile_picture,
      },
      posts,
      postCount,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error.message);
    res.status(500).json({
      code: 500,
      status: false,
      message: "Failed to fetch user posts",
      error: error.message,
    });
  }
};

const getAllPostsOfUserByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ author_id: userId })
      .populate("category", "title")
      .populate("author_id", "username profile_picture");

    res.status(200).json({
      code: 200,
      status: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts by user:", error.message);
    res.status(500).json({
      code: 500,
      status: false,
      message: "Failed to fetch posts by user",
      error: error.message,
    });
  }
};

const getFilteredPosts = async (req, res) => {
  const { query } = req.query.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    return res.json(posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching posts" });
  }
};

const checkCategoryUsage = async (req, res) => {
  const { categoryTitle } = req.query;

  try {
    const count = await Post.countDocuments({ categoryTitle });
    res.status(200).json({ exists: count > 0 });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check category usage",
      error: error.message,
    });
  }
};

const checkCategoryUsagetest = async (req, res) => {
  const { categoryTitle } = req.query;

  try {
    const count = await Post.countDocuments({ categoryTitle });
    res.status(200).json({ exists: count > 0 });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check category usage",
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  getPostWithLikes,
  updatePost,
  deletePost,
  getSavedPosts,
  removeSavedPost,
  getRelatedPosts,
  getUserPostsCount,
  getAllPostsOfUserByUserId,
  getFilteredPosts,
  checkCategoryUsage,
  checkCategoryUsagetest,
};
