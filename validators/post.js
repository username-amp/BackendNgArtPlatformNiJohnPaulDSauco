const { check, body } = require("express-validator");

const postValidation = [
  check("title").notEmpty().withMessage("Title is required"),
  check("description").notEmpty().withMessage("Description is required"),
  check("author_id")
    .notEmpty()
    .withMessage("authors id is required")
    .isMongoId()
    .withMessage("Author ID must be a valid MongoDB ObjectId"),
  check("categoryTitle").notEmpty().withMessage("Category title is required"),
  body("files")
    .custom((value, { req }) => {
      if (!req.files || req.files.length === 0) {
        throw new Error("At least one image must be uploaded");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(
            `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and GIF are allowed.`
          );
        }
      }
      return true;
    })
    .withMessage("Invalid file upload"),
];

const savePostValidation = [
  check("userId").notEmpty().withMessage("User ID is required").isMongoId(),
  check("postId").notEmpty().withMessage("Post ID is required").isMongoId(),
];

module.exports = { postValidation, savePostValidation };
