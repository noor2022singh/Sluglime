const Community = require("../models/Community");
const Post = require("../models/Post");
const User = require("../models/User");
const CommunityRequest = require("../models/CommunityRequest");
const { createNotification } = require("./notificationController");
const GlobalSettings = require("../models/GlobalSettings");
const ADMIN_EMAIL = process.env.EMAIL_USER;

async function isAppAdmin(req, res, next) {
  const { userEmail } = req.body;
  if (!userEmail || userEmail !== ADMIN_EMAIL) {
    return res
      .status(403)
      .json({ error: "Only app admin can perform this action." });
  }
  next();
}

exports.getGlobalTags = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) settings = await GlobalSettings.create({ tags: [] });
    res.json(settings.tags);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.addGlobalTag = [
  isAppAdmin,
  async (req, res) => {
    try {
      const { tag } = req.body;
      if (!tag) return res.status(400).json({ error: "Tag is required" });
      let settings = await GlobalSettings.findOne();
      if (!settings) settings = await GlobalSettings.create({ tags: [] });
      if (settings.tags.includes(tag))
        return res.status(400).json({ error: "Tag already exists" });
      settings.tags.push(tag);
      await settings.save();
      res.json(settings.tags);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
];

exports.removeGlobalTag = [
  isAppAdmin,
  async (req, res) => {
    try {
      const { tag } = req.body;
      let settings = await GlobalSettings.findOne();
      if (!settings) settings = await GlobalSettings.create({ tags: [] });
      settings.tags = settings.tags.filter((t) => t !== tag);
      await settings.save();
      res.json(settings.tags);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
];

exports.createCommunity = async (req, res) => {
  try {
    const { name, description, privacy, category, rules, tags, creatorId } =
      req.body;

    if (!name || !creatorId) {
      return res
        .status(400)
        .json({ error: "Community name and creator are required" });
    }

    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ error: "Community name already exists" });
    }

    const user = await User.findById(creatorId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let avatar = "";
    let banner = "";

    if (req.files && req.files.avatar && req.files.avatar[0]) {
      avatar = req.files.avatar[0].path;
    }

    if (req.files && req.files.banner && req.files.banner[0]) {
      banner = req.files.banner[0].path;
    }

    const community = new Community({
      name,
      description: description || "",
      privacy: privacy || "public",
      category: category || "other",
      creator: creatorId,
      admins: [creatorId],
      members: [creatorId],
      memberCount: 1,
      rules: rules || [],
      tags: tags || [],
      avatar,
      banner,
    });

    await community.save();

    res.status(201).json(community);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllCommunities = async (req, res) => {
  try {
    const { category, privacy, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (category) query.category = category;
    if (privacy) query.privacy = privacy;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const communities = await Community.find(query)
      .populate("creator", "name username avatar")
      .populate("admins", "name username avatar")
      .sort({ memberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("creator", "name username avatar")
      .populate("admins", "name username avatar")
      .populate("members", "name username avatar");

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const actualPostCount = await Post.countDocuments({
      community: req.params.id,
      isCommunityPost: true,
      hidden: { $ne: true },
    });

    if (community.postCount !== actualPostCount) {
      community.postCount = actualPostCount;
      await community.save();
    }

    res.json(community);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.joinCommunity = async (req, res) => {
  try {
    const { userId, isPrivate } = req.body;
    const communityId = req.params.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.members.includes(userId)) {
      return res.status(400).json({ error: "Already a member" });
    }

    const existingRequest = await CommunityRequest.findOne({
      community: communityId,
      user: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Join request already pending" });
    }

    if (community.privacy === "private" || isPrivate) {
      const joinRequest = new CommunityRequest({
        community: communityId,
        user: userId,
        status: "pending",
      });
      await joinRequest.save();

      const user = await User.findById(userId);
      const admins =
        community.admins.length > 0 ? community.admins : [community.creator];

      for (const adminId of admins) {
        if (adminId.toString() !== userId) {
          await createNotification(
            adminId,
            "community_request",
            `${user?.name || user?.username || "Someone"} wants to join ${
              community.name
            }`,
            userId,
            null,
            null,
            { communityId, requestId: joinRequest._id }
          );
        }
      }

      res.json({
        message: "Join request sent successfully",
        isPrivate: true,
      });
    } else {
      community.members.push(userId);
      community.memberCount = community.members.length;
      await community.save();

      res.json({ message: "Joined community successfully" });
    }
  } catch (err) {
    console.error("Error joining community:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.leaveCommunity = async (req, res) => {
  try {
    const { userId } = req.body;
    const communityId = req.params.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (!community.members.includes(userId)) {
      return res.status(400).json({ error: "Not a member" });
    }

    community.members = community.members.filter(
      (id) => id.toString() !== userId
    );
    community.admins = community.admins.filter(
      (id) => id.toString() !== userId
    );
    community.memberCount = community.members.length;
    await community.save();

    res.json({ message: "Left community successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserCommunities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = "all" } = req.query;

    let query = { members: userId, isActive: true };

    if (type === "created") {
      query.creator = userId;
    } else if (type === "admin") {
      query.admins = userId;
    }

    const communities = await Community.find(query)
      .populate("creator", "name username avatar")
      .populate("admins", "name username avatar")
      .sort({ memberCount: -1, createdAt: -1 });

    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCommunityPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, category } = req.query;
    const skip = (page - 1) * limit;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const postFilter = {
      community: id,
      isCommunityPost: true,
      hidden: { $ne: true },
    };
    if (category) {
      postFilter.category = category;
    }

    const posts = await Post.find(postFilter)
      .populate("author", "name username avatar")
      .populate("community", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(postFilter);

    res.json({
      posts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, privacy, category, rules, tags } = req.body;
    const { userId } = req.body;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (!community.admins.includes(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (privacy) updates.privacy = privacy;
    if (category) updates.category = category;
    if (rules) updates.rules = rules;
    if (tags) updates.tags = tags;

    if (req.files && req.files.avatar && req.files.avatar[0]) {
      updates.avatar = req.files.avatar[0].path;
    }
    if (req.files && req.files.banner && req.files.banner[0]) {
      updates.banner = req.files.banner[0].path;
    }

    const updatedCommunity = await Community.findByIdAndUpdate(id, updates, {
      new: true,
    })
      .populate("creator", "name username avatar")
      .populate("admins", "name username avatar");

    res.json(updatedCommunity);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only creator can delete community" });
    }

    await Post.updateMany(
      { community: id },
      { $unset: { community: 1 }, isCommunityPost: false }
    );

    await Community.findByIdAndDelete(id);

    res.json({ message: "Community deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getTrendingCommunities = async (req, res) => {
  try {
    const communities = await Community.find({ isActive: true })
      .populate("creator", "name username avatar")
      .sort({ memberCount: -1, postCount: -1 })
      .limit(10);

    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId } = req.body;

    const joinRequest = await CommunityRequest.findById(requestId)
      .populate("community")
      .populate("user", "name username avatar");

    if (!joinRequest) {
      return res.status(404).json({ error: "Join request not found" });
    }

    const community = joinRequest.community;

    if (
      !community.admins.includes(adminId) &&
      community.creator.toString() !== adminId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!community.members.includes(joinRequest.user._id)) {
      community.members.push(joinRequest.user._id);
      community.memberCount = community.members.length;
      await community.save();
    }

    joinRequest.status = "approved";
    await joinRequest.save();

    await createNotification(
      joinRequest.user._id,
      "community_approved",
      `Your request to join ${community.name} has been approved!`,
      adminId
    );

    res.json({ message: "Join request approved successfully" });
  } catch (err) {
    console.error("Error approving join request:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.rejectJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId } = req.body;

    const joinRequest = await CommunityRequest.findById(requestId)
      .populate("community")
      .populate("user", "name username avatar");

    if (!joinRequest) {
      return res.status(404).json({ error: "Join request not found" });
    }

    const community = joinRequest.community;

    if (
      !community.admins.includes(adminId) &&
      community.creator.toString() !== adminId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    joinRequest.status = "rejected";
    await joinRequest.save();

    await createNotification(
      joinRequest.user._id,
      "community_rejected",
      `Your request to join ${community.name} has been rejected.`,
      adminId
    );

    res.json({ message: "Join request rejected successfully" });
  } catch (err) {
    console.error("Error rejecting join request:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { adminId } = req.query;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (
      !community.admins.includes(adminId) &&
      community.creator.toString() !== adminId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const pendingRequests = await CommunityRequest.find({
      community: communityId,
      status: "pending",
    })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    res.json(pendingRequests);
  } catch (err) {
    console.error("Error getting pending requests:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    res.json(community.categories || []);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, icon } = req.body;
    if (!name)
      return res.status(400).json({ error: "Category name is required" });
    const community = await Community.findById(id);
    if (!community)
      return res.status(404).json({ error: "Community not found" });
    if (
      !community.admins.includes(userId) &&
      community.creator.toString() !== userId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (
      community.categories.some(
        (cat) => cat.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return res.status(400).json({ error: "Category name already exists" });
    }
    community.categories.push({ name, icon: icon || "" });
    await community.save();
    res.json(community.categories);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id, categoryName } = req.params;
    const { userId, newName, icon } = req.body;
    const community = await Community.findById(id);
    if (!community)
      return res.status(404).json({ error: "Community not found" });
    if (
      !community.admins.includes(userId) &&
      community.creator.toString() !== userId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const catIndex = community.categories.findIndex(
      (cat) => cat.name === categoryName
    );
    if (catIndex === -1)
      return res.status(404).json({ error: "Category not found" });
    if (newName) community.categories[catIndex].name = newName;
    if (icon !== undefined) community.categories[catIndex].icon = icon;
    await community.save();
    res.json(community.categories);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id, categoryName } = req.params;
    const { userId } = req.body;
    const community = await Community.findById(id);
    if (!community)
      return res.status(404).json({ error: "Community not found" });
    if (
      !community.admins.includes(userId) &&
      community.creator.toString() !== userId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const catIndex = community.categories.findIndex(
      (cat) => cat.name === categoryName
    );
    if (catIndex === -1)
      return res.status(404).json({ error: "Category not found" });
    community.categories.splice(catIndex, 1);
    await community.save();
    res.json(community.categories);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
