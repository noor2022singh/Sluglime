const Notification = require("../models/Notification");
const User = require("../models/User");

function emitNotification(io, userId, notification) {
  io.to(userId).emit("notification", notification);
}

async function createNotification(
  userId,
  type,
  message,
  fromUserId = null,
  postId = null,
  commentId = null,
  metadata = null
) {
  try {
    const notification = new Notification({
      user: userId,
      type: type,
      message: message,
      fromUser: fromUserId,
      postId: postId,
      commentId: commentId,
      metadata: metadata,
    });
    await notification.save();

    if (fromUserId) {
      await notification.populate("fromUser", "username name avatar");
    }

    const app = require('../server');
    if (app && app.get) {
      const io = app.get('io');
      if (io) {
        io.to(userId.toString()).emit('notification', notification);
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId;
    const notifications = await Notification.find({ user: userId })
      .populate("fromUser", "username name avatar")
      .populate("postId", "title content")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    console.error("Error getting notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.body.userId;
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await Notification.deleteMany({ user: userId });

    res.json({
      success: true,
      message: "All notifications cleared",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createSampleNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const sampleNotifications = [
      {
        user: userId,
        type: "like",
        message: "Udaynoor Singh liked your post",
        read: false,
      },
      {
        user: userId,
        type: "comment",
        message: "Aditya commented on your post",
        read: false,
      },
      {
        user: userId,
        type: "follow",
        message: "John Doe started following you",
        read: true,
      },
      {
        user: userId,
        type: "reply",
        message: "Sarah replied to your comment",
        read: false,
      },
      {
        user: userId,
        type: "like",
        message: "Mike liked your post about technology",
        read: true,
      },
    ];

    await Notification.insertMany(sampleNotifications);

    res.json({ success: true, message: "Sample notifications created" });
  } catch (err) {
    console.error("Error creating sample notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.testNotification = async (req, res) => {
  try {
    const { userId, type = "like", message = "Test notification" } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const notification = await createNotification(
      userId,
      type,
      message,
      null,
      null,
      null
    );

    if (notification) {
      res.json({
        success: true,
        message: "Test notification created",
        notification,
      });
    } else {
      res.status(500).json({ error: "Failed to create test notification" });
    }
  } catch (err) {
    console.error("Error creating test notification:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  emitNotification,
  createNotification,
  getNotifications: exports.getNotifications,
  markRead: exports.markRead,
  clearAllNotifications: exports.clearAllNotifications,
  createSampleNotifications: exports.createSampleNotifications,
  testNotification: exports.testNotification,
};
