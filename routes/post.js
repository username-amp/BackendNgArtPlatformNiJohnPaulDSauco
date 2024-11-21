const express = require("express");
const router = express.Router();
const { postController } = require("../controllers");
const { postValidation, savePostValidation } = require("../validators/post");
const validate = require("../validators/validate");
const upload = require("../middleware/multerConfig");
const isAuth = require("../middleware/isAuth");
const { check } = require("express-validator");

router.post(
  "/create-post",
  isAuth,
  upload.array("image_url", 6),
  postValidation,
  validate,
  postController.createPost
);

router.get("/get-post", isAuth, postController.getAllPosts);

router.put(
  "/update-post/:postId",
  isAuth,
  postValidation,
  validate,
  postController.updatePost
);

router.delete(
  "/delete-post/:postId",
  isAuth,
  postValidation,
  validate,
  postController.deletePost
);

router.delete(
  `/remove-saved-post`,
  isAuth,
  savePostValidation,
  validate,
  postController.removeSavedPost
);

router.get(
  "/get-saved-posts/:userId",
  isAuth,
  [
    check(`userId`)
      .isMongoId()
      .withMessage(`User ID must be a valid MongoDB ObjectId`),
  ],
  validate,
  postController.getSavedPosts
);

module.exports = router;
