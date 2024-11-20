const { body } = require("express-validator");

const validateLike = [
  body("postId")
    .isMongoId()
    .withMessage("Invalid postId format. It must be a valid MongoDB ObjectId."),
  body("authorId")
    .isMongoId()
    .withMessage(
      "Invalid authorId format. It must be a valid MongoDB ObjectId."
    ),
  body("recipientId")
    .isMongoId()
    .withMessage(
      "Invalid recipientId format. It must be a valid MongoDB ObjectId."
    ),
];

const validateComment = [
  body("postId")
    .isMongoId()
    .withMessage("Invalid postId format. It must be a valid MongoDB ObjectId."),
  body("authorId")
    .isMongoId()
    .withMessage(
      "Invalid authorId format. It must be a valid MongoDB ObjectId."
    ),
  body("recipientId")
    .isMongoId()
    .withMessage(
      "Invalid recipientId format. It must be a valid MongoDB ObjectId."
    ),
  body("commentContent")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Comment content cannot be empty.")
    .isLength({ max: 500 })
    .withMessage("Comment content must not exceed 500 characters."),
];

const validateSave = [
  body("postId")
    .isMongoId()
    .withMessage("Invalid postId format. It must be a valid MongoDB ObjectId."),
  body("userId")
    .isMongoId()
    .withMessage("Invalid userId format. It must be a valid MongoDB ObjectId."),
];

module.exports = {
  validateLike,
  validateComment,
  validateSave,
};
