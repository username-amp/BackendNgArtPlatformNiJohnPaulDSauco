const { param } = require("express-validator");
const User = require("../models/User");

const validateFollowRequest = [
  param("id")
    .custom(async (id) => {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("User not found.");
      }
      return true;
    })
    .withMessage("Invalid user ID."),
];

module.exports = { validateFollowRequest };
