const express = require("express");
const router = express.Router();
const { postController } = require("../controllers");
const { postValidation } = require("../validators/post");
const validate = require("../validators/validate");
const upload = require("../middleware/multerConfig");
const isAuth = require("../middleware/isAuth");

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

module.exports = router;
