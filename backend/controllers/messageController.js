const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.sendImage = async (req, res) => {
  try {
    const { uploadChatImage, getImageUrl } = require("../config/cloudinary");

    uploadChatImage.single("image")(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No image file provided" });
      }

      const { senderId, receiverId } = req.body;

      if (!senderId || !receiverId) {
        console.error("Missing senderId or receiverId");
        return res
          .status(400)
          .json({ error: "Sender and receiver IDs are required" });
      }

      const imageUrl = req.file.path;

      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content: imageUrl,
        type: "image",
        imageUrl: imageUrl,
      });

      await message.save();
      await message.populate("sender", "username name avatar");

      res.json({
        success: true,
        message: message,
      });
    });
  } catch (err) {
    console.error("Error sending image:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
    });

    await message.save();

    await message.populate("sender", "username name avatar");

    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!userId1 || !userId2) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    })
      .populate("sender", "username name avatar")
      .populate("receiver", "username name avatar")
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    await Message.updateMany(
      { sender: userId2, receiver: userId1, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    console.error("Error getting conversation:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(userId) },
            { receiver: mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$sender", mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { "lastMessage.timestamp": -1 },
      },
    ]);

    const populatedConversations = await Message.populate(conversations, [
      { path: "_id", select: "username name avatar" },
      { path: "lastMessage.sender", select: "username name avatar" },
      { path: "lastMessage.receiver", select: "username name avatar" },
    ]);

    res.json(populatedConversations);
  } catch (err) {
    console.error("Error getting user conversations:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await Message.updateMany(
      { sender: senderId, receiver: receiverId, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    const count = await Message.countDocuments({
      receiver: userId,
      read: false,
    });

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ error: "Server error" });
  }
};
