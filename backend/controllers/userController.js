const User = require("../models/User");
const Notification = require("../models/Notification");
const {
  emitNotification,
  createNotification,
} = require("./notificationController");
const GlobalSettings = require('../models/GlobalSettings');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, avatar, bannerImage, bio, interests } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (bannerImage !== undefined) user.bannerImage = bannerImage;
    if (bio !== undefined) user.bio = bio;
    if (interests !== undefined) {
      let settings = await GlobalSettings.findOne();
      const allowedTags = settings ? settings.tags : [];
      const filtered = Array.isArray(interests) ? interests.filter(i => allowedTags.includes(i)) : [];
      user.interests = filtered;
    }
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.subscribeUser = async (req, res) => {
  try {
    const currentUserId = req.body.currentUserId;
    if (!currentUserId)
      return res.status(400).json({ error: "currentUserId required" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const index = user.subscribers.indexOf(currentUserId);
    if (index === -1) {
      user.subscribers.push(currentUserId);
    } else {
      user.subscribers.splice(index, 1);
    }
    await user.save();
    res.json({
      subscribers: user.subscribers.length,
      subscribed: index === -1,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.body.currentUserId;
    if (!currentUserId)
      return res.status(400).json({ error: "currentUserId required" });
    if (currentUserId === req.params.id)
      return res.status(400).json({ error: "Cannot follow yourself" });
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(currentUserId);
    if (!user || !currentUser)
      return res.status(404).json({ error: "User not found" });
    if (!user.followers.includes(currentUserId)) {
      user.followers.push(currentUserId);
      currentUser.following.push(user._id);
      await user.save();
      await currentUser.save();
      await createNotification(
        user._id,
        "follow",
        `${currentUser.name} started following you`,
        currentUser._id
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("user_followed", {
        userId: user._id,
        followerId: currentUser._id,
        followersCount: user.followers.length,
        followingCount: currentUser.following.length,
      });
    }

    res.json({
      followers: user.followers.length,
      following: currentUser.following.length,
      followingUser: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.body.currentUserId;
    if (!currentUserId)
      return res.status(400).json({ error: "currentUserId required" });
    if (currentUserId === req.params.id)
      return res.status(400).json({ error: "Cannot unfollow yourself" });
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(currentUserId);
    if (!user || !currentUser)
      return res.status(404).json({ error: "User not found" });
    user.followers = user.followers.filter(
      (f) => f.toString() !== currentUserId
    );
    currentUser.following = currentUser.following.filter(
      (f) => f.toString() !== user._id.toString()
    );
    await user.save();
    await currentUser.save();
    res.json({
      followers: user.followers.length,
      following: currentUser.following.length,
      followingUser: false,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "name username avatar"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "name username avatar"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    user.avatar = req.file.path;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
exports.uploadBanner = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    user.bannerImage = req.file.path;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
