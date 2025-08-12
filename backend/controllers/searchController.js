const User = require("../models/User");

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required." });
    }
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};
