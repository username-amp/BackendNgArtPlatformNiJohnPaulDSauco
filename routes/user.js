const express = require("express");
const {
  userController
} = require("../controllers");
const { validateFollowRequest } = require("../validators/user");

const router = express.Router();

router.post("/follow/:_id", validateFollowRequest, userController.followUser);


router.post("/unfollow/:_id", validateFollowRequest, userController.unfollowUser);


router.get("/:id/followers", userController.getFollowers);

router.get("/:id/following", userController.getFollowing);

module.exports = router;
