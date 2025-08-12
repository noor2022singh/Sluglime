const Feedback = require("../models/Feedback");
const User = require("../models/User");

exports.submitFeedback = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res
        .status(400)
        .json({ error: "User ID and message are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const feedback = new Feedback({
      userId: user._id,
      username: user.username,
      email: user.email,
      message: message.trim(),
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully!",
      feedback: {
        id: feedback._id,
        message: feedback.message,
        timestamp: feedback.timestamp,
      },
    });
  } catch (err) {
    console.error("Submit feedback error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ timestamp: -1 })
      .populate("userId", "username name email");

    res.json(feedbacks);
  } catch (err) {
    console.error("Get feedbacks error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found." });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully.",
    });
  } catch (err) {
    console.error("Delete feedback error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.deleteAllFeedbacks = async (req, res) => {
  try {
    const result = await Feedback.deleteMany({});

    res.json({
      success: true,
      message: `All feedbacks (${result.deletedCount}) deleted successfully.`,
    });
  } catch (err) {
    console.error("Delete all feedbacks error:", err);
    res.status(500).json({ error: "Server error." });
  }
};
