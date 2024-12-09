const express = require("express");
const router = express.Router();
const { postController } = require("../controllers");
const { postValidation, savePostValidation } = require("../validators/post");
const validate = require("../validators/validate");
const upload = require("../middleware/multerConfig");
const isAuth = require("../middleware/isAuth");
const { check } = require("express-validator");
const { checkExplicitContent } = require("../middleware/checkExplicitContent");
const artCategoryMiddleware = require("../middleware/artCategoryMiddleware");

router.post(
  "/create-post",
  isAuth,
  upload.array("image_url", 6),
  artCategoryMiddleware,
  checkExplicitContent,
  postValidation,
  validate,
  postController.createPost
);

router.get("/get-post", isAuth, postController.getAllPosts);

router.get(
  "/get-post/:postId",
  isAuth,
  [
    check(`postId`)
      .isMongoId()
      .withMessage(`Post ID must be a valid MongoDB ObjectId`),
  ],
  validate,
  postController.getPostById
);

router.get(
  "/likes/:postId",
  isAuth,
  validate,
  postController.getPostWithLikes
);

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

router.get(
  `/related-posts/:categoryId`,
  isAuth,
  postController.getRelatedPosts
);

router.get(
  `/get-user-posts-count/:userId`,
  isAuth,
  postController.getUserPostsCount
);

router.get(
  `/get-all-posts-of-user-by-user-id/:userId`,
  isAuth,
  postController.getAllPostsOfUserByUserId
);

router.get(`/get-post/search`, isAuth, postController.getFilteredPosts);

router.get(
  "/check-category",
  isAuth,
  validate,
  postController.checkCategoryUsage
);

module.exports = router;
