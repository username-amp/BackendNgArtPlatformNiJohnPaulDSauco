const express = require("express");
const router = express.Router();
const { notificationsController } = require("../controllers");
const { notificationValidations } = require(`../validators/notifications`);
const isAuth = require("../middleware/isAuth");
const validate = require("../validators/validate");

router.get(
  "/:userId",
  isAuth,
  notificationValidations.getNotifications,
  validate,
  notificationsController.getNotifications
);

router.post(
  "/markAsRead",
  isAuth,
  notificationValidations.markAsRead,
  validate,
  notificationsController.markAsRead
);

router.put(
  "/:userId/markAllAsRead",
  isAuth,
  notificationsController.markAllAsRead,
  validate,
  notificationsController.markAllAsRead
);

module.exports = router;
