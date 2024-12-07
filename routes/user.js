const express = require("express");
const { userController } = require("../controllers");
const { validateFollowRequest } = require("../validators/user");
const isAuth = require("../middleware/isAuth");
const validate = require("../validators/validate");

const router = express.Router();

router.post("/follow/:_id", validateFollowRequest, userController.followUser);

router.post(
  "/unfollow/:_id",
  validateFollowRequest,
  userController.unfollowUser
);

router.get("/:id/followers", userController.getFollowers);

router.get("/:id/following", userController.getFollowing);

router.patch(
  "/increament-violation/:_id",
  isAuth,
  userController.increamentViolation
);

router.get(
  "/:userId/violations",
  validate,
  isAuth,
  userController.getUserViolations
);

router.get(
  "/violations/:userId",
  validate,
  isAuth,
  userController.getViolation
);

module.exports = router;
