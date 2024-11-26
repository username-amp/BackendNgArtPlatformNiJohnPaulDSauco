const mongoose = require(`mongoose`);
const { Schema, Types } = mongoose;
const User = require(`./User`);
const Post = require(`./Post`);

const notificationSchema = new Schema(
  {
    recipient: {
      type: Types.ObjectId,
      ref: `User`,
      required: true,
    },

    author: {
      type: Types.ObjectId,
      ref: `User`,
      required: true,
    },

    type: {
      type: String,
      enum: [`like`, `unlike`, `comment`, `save`],
      required: true,
    },

    post: {
      type: Types.ObjectId,
      ref: `Post`,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(`Notifications`, notificationSchema);
