const Category = require("../models/Category");
const Post = require("../models/Post");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch categories", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { categoryTitle } = req.body;

  try {
    const isCategoryInUse = await Post.exists({ categoryTitle });

    if (isCategoryInUse) {
      return res.status(400).json({
        message: `Category '${categoryTitle}' is still being used in posts.`,
      });
    }

    const deletedCategory = await Category.findOneAndDelete({
      title: categoryTitle,
    });

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ message: `Category '${categoryTitle}' not found.` });
    }

    res.status(200).json({
      message: `Category '${categoryTitle}' was successfully deleted.`,
      deletedCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

module.exports = { getAllCategories, deleteCategory };
