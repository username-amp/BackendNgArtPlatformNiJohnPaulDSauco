const express = require("express");
const { interactionsController } = require("../controllers");
const {
  validateLike,
  validateComment,
  validateSave,
} = require("../validators/interactions");
const isAuth = require("../middleware/isAuth");
const validate = require("../validators/validate");
const router = express.Router();

router.post(
  "/like",
  isAuth,
  validateLike,
  validate,
  interactionsController.likePost
);

router.post(
  "/comment",
  isAuth,
  validateComment,
  validate,
  interactionsController.commentPost
);
router.post(
  "/save",
  isAuth,
  validateSave,
  validate,
  interactionsController.savePost
);

router.post(
  "/unlike",
  isAuth,
  validateLike,
  validate,
  interactionsController.unlikePost
);

router.get("/comments/:postId", isAuth, interactionsController.getComments);

router.get(
  "/get-liked-posts/:userId",
  isAuth,
  interactionsController.getLikedPosts
);

router.post(`/follow/:authorId`, isAuth, interactionsController.followUser);

router.post(`/unfollow/:authorId`, isAuth, interactionsController.unfollowUser);

router.put(
  `/edit-comment/:commentId`,
  isAuth,
  interactionsController.editComment
);

router.delete(
  `/delete-comment/:commentId`,
  isAuth,
  interactionsController.deleteComment
);

router.get(
  `/saved-status/:postId`,
  isAuth,
  validate,
  interactionsController.getSavedStatus
);

router.get(
  `/check-follow/:authorId`,
  isAuth,
  validate,
  interactionsController.checkFollowStatus
);

module.exports = router;
