const User = require("../models/User");

const followUser = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  if (id === currentUserId) {
    return res.status(400).json({ error: "You cannot follow yourself." });
  }

  try {
    const userToFollow = await User.findById(id);
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
    currentUser.following.push(id);

    await userToFollow.save();
    await currentUser.save();

    return res.status(200).json({ message: "User followed successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
};

const unfollowUser = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const userToUnfollow = await User.findById(id);
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
      (followingId) => followingId.toString() !== id
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

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
