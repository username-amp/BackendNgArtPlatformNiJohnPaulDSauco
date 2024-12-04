const User = require("../models/User");
const Violation = require("../models/Violation");

const followUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (currentUserId === _id) {
    return res.status(400).json({ error: "You cannot follow yourself." });
  }

  try {
    const userToFollow = await User.findById(_id);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (userToFollow.followers.includes(currentUserId)) {
      return res
        .status(400)
        .json({ error: "You are already following this user." });
    }

    userToFollow.followers.push(currentUserId);
    currentUser.following.push(_id);

    await userToFollow.save();
    await currentUser.save();

    return res.status(200).json({ message: "User followed successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
};

const unfollowUser = async (req, res) => {
  const { _id } = req.params;
  const currentUserId = req.user._id;

  try {
    const userToUnfollow = await User.findById(_id);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!userToUnfollow.followers.includes(currentUserId)) {
      return res
        .status(400)
        .json({ error: "You are not following this user." });
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => followerId.toString() !== currentUserId
    );
    currentUser.following = currentUser.following.filter(
      (followingId) => followingId.toString() !== _id
    );

    await userToUnfollow.save();
    await currentUser.save();

    return res.status(200).json({ message: "User unfollowed successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
};

const getFollowers = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate(
      "followers",
      "username email profile_picture"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json(user.followers);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
};

const getFollowing = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate(
      "following",
      "username email profile_picture"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json(user.following);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
};

const increamentViolation = async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.violations += 1;

    if (user.violations === 2) {
      await user.save();

      return res.status(200).json({
        message:
          "You have 2 violations. Please be cautious! Further violations will result in restriction or ban.",
      });
    }

    if (user.violations >= 3) {
      user.isBanned = true;
      res.clearCookie("token");

      await user.save();

      return res.status(403).json({
        message:
          "You have been banned due to 3 violations. Please contact support.",
      });
    }

    await user.save();

    await Violation.create({
      userId: req.params._id,
      reason: "Inappropriate content in post",
    });

    res.status(200).json({ message: "Violation recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserViolations = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("violations");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ violations: user.violations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getViolation = async (req, res) => {
  const { userId } = req.params;

  try {
    const violations = await Violation.find({ userId });

    const user = await User.findById(userId, "violationCount");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      violations,
      violationCount: user.violationCount || 0,
    });
  } catch (error) {
    console.error("Error fetching violations:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  increamentViolation,
  getUserViolations,
  getViolation,
};
