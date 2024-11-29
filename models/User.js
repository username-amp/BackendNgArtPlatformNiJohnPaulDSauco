const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profile_picture: {
      type: String,
      default: "",
    },
    cover_photo: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    followers: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    savedPosts: [
      {
        type: Types.ObjectId,
        ref: "Post",
      },
    ],
    verificationCode: {
      type: String,
      default: null,
    }, 
    forgotPasswordCode: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
