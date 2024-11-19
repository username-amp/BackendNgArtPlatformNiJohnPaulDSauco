const { check } = require("express-validator");

const postValidation = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("author_id")
    .notEmpty()
    .withMessage("Author ID is required")
    .isMongoId()
    .withMessage("Author ID must be a valid MongoDB ObjectId"),

  check("categoryTitle").notEmpty().withMessage("Category title is required"),
];
module.exports = { postValidation };
