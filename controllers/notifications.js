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
      .populate("author", "username") // Populating author
      .populate("post", "title _id image_url") // Populating the psot field
      .exec();

    const formattedNotifications = notifications.map((notif) => {
      let message = "";
      let url = ""; // Add a URL field

      switch (notif.type) {
        case "like":
          message = `${notif.author?.username} liked your post`; // Including author's username
          url = `/post/${notif.post?._id}`; // Using the populated `post._id` for the URL
          break;
        case "comment":
          message = `${notif.author?.username} commented on your post`; // Including author's username
          url = `/post/${notif.post?._id}`; // Using the populated `post._id` for the URL
          break;
        case "follow":
          message = `${notif.author?.username} started following you`; // Including author's username
          url = `/profile/${notif.author?._id}`; // Link to the author's profile
          break;
        case "save":
          message = `${notif.author?.username} saved your post`; // Including author's username
          url = `/post/${notif.post?._id}`; // Using the populated `post._id` for the URL
          break;
        default:
          message = `${notif.author?.username} performed a new activity`; // Default message
          url = "/"; // Default URL
      }

      return {
        ...notif._doc,
        message,
        url, // Include the URL in the formatted notification
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
