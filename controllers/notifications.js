const Notification = require("../models/Notifications");

const getNotifications = async (req, res) => {
  const { userId } = req.params;
  const { lastNotificationId, limit = 20, type } = req.query;

  try {
    const parsedLimit = parseInt(limit) || 20;

    const query = { recipient: userId };

    if (lastNotificationId) {
      query._id = { $lt: lastNotificationId };
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("author", "username") // Fetch only the username of the author
      .exec();

    const formattedNotifications = notifications.map((notif) => {
      let message = "";
      switch (notif.type) {
        case "like":
          message = `Liked your post`;
          break;
        case "comment":
          message = `Commented on your post`;
          break;
        case "follow":
          message = `Started following you`;
          break;
        case "save":
          message = `Saved your post`;
          break;
        default:
          message = `New activity`;
      }

      return {
        ...notif._doc,
        message,
      };
    });

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};




const markAsRead = async (req, res) => {
  const { notificationIds } = req.body;

  if (!notificationIds || notificationIds.length === 0) {
    return res.status(400).json({ message: "No notification IDs provided" });
  }

  try {
    const updatedNotifications = await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { isRead: true } }
    );

    console.log("Updated notifications:", updatedNotifications);

    if (updatedNotifications.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found to update" });
    }

    res.status(200).json({
      message: `${updatedNotifications.modifiedCount} notifications marked as read`,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

const markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    const updatedNotifications = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const modifiedCount =
      updatedNotifications.modifiedCount ?? updatedNotifications.nModified ?? 0;

    if (modifiedCount === 0) {
      return res.status(404).json({
        message: "No unread notifications found to update",
      });
    }

    res.status(200).json({
      message: `${modifiedCount} notifications marked as read`,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
