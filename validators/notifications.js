const { body, query, param } = require("express-validator");

const notificationValidations = {
  getNotifications: [
    param("userId")
      .isMongoId()
      .withMessage("Invalid userId format")
      .notEmpty()
      .withMessage("userId is required"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),

    query("lastNotificationId")
      .optional()
      .isMongoId()
      .withMessage("lastNotificationId must be a valid MongoDB ObjectId"),
  ],

  markAsRead: [
    body("notificationIds")
      .isArray({ min: 1 })
      .withMessage("notificationIds must be a non-empty array")
      .custom((value) => value.every((id) => id.match(/^[0-9a-fA-F]{24}$/)))
      .withMessage("All notificationIds must be valid ObjectIds")
      .notEmpty()
      .withMessage("notificationIds is required"),
  ],

  markAllAsRead: [
    param("userId")
      .isMongoId()
      .withMessage("Invalid userId format")
      .notEmpty()
      .withMessage("userId is required"),
  ],
};

module.exports = {
  notificationValidations,
};
