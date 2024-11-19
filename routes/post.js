const express = require("express");
const router = express.Router();
const { postController } = require("../controllers");
const { postValidation } = require("../validators/post");
const validate = require("../validators/validate");
const upload = require("../middleware/multerConfig");

router.post(
  "/create-post",
  upload.array("image_url", 6),
  postValidation,
  validate,
  postController.createPost
);

router.get("/get-post", postController.getAllPosts);

router.put(
  "/update-post/:postId",
  postValidation,
  validate,
  postController.updatePost
);

router.delete(
  "/delete-post/:postId",
  postValidation,
  validate,
  postController.deletePost
);

module.exports = router;
