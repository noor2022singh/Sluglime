const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const DynamicLinkService = require("../services/dynamicLinks");
const {
  emitNotification,
  createNotification,
} = require("./notificationController");
const {
  uploadPost,
  uploadAvatar,
  getImageUrl,
} = require("../config/cloudinary");
const GlobalSettings = require("../models/GlobalSettings");
const WhistleSubmission = require("../models/WhistleSubmission");

exports.uploadWhistle = uploadPost.fields([
  { name: "image", maxCount: 1 },
  { name: "proofImages", maxCount: 10 },
]);
exports.upload = uploadPost;

const User = require("../models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "garsh5444@gmail.com",
    pass: "lavipmdevvokbfvj",
  },
});

async function sendInterestEmail(to, post) {
  await transporter.sendMail({
    from: "Sluglime <garsh5444@gmail.com>",
    to,
    subject: "New whistle relevant to your interests",
    text: `A new whistle was posted: ${post.title}\n\n${post.content}\n\nView it in the app!`,
  });
}

exports.getPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.excludeWhistle === "true") {
      filter.anonymous = { $ne: true };
    } else if (req.query.whistleOnly === "true") {
      filter.anonymous = true;
    }

    filter.isCommunityPost = { $ne: true };

    const posts = await Post.find(filter)
      .populate("author", "username name avatar")
      .populate({
        path: "repostOf",
        populate: { path: "author", select: "username name avatar" },
      })
      .populate("community", "name")
      .sort({ createdAt: -1 });

    const counts = await Promise.all(
      posts.map((p) => Comment.countDocuments({ post: p._id }))
    );
    const mappedPosts = posts.map((post, idx) => {
      if (post.anonymous) {
        return {
          ...post.toObject(),
          comments: counts[idx] || 0,
          author: {
            username: "Anonymous",
            name: "Anonymous",
            avatar: "",
            _id: undefined,
          },
        };
      }
      return { ...post.toObject(), comments: counts[idx] || 0 };
    });
    res.json(mappedPosts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWhistleBlowPosts = async (req, res) => {
  try {
    const filter = { 
      anonymous: true,
      isCommunityPost: { $ne: true } 
    };

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const posts = await Post.find(filter)
      .populate("author", "username name avatar")
      .populate({
        path: "repostOf",
        populate: { path: "author", select: "username name avatar" },
      })
      .sort({ createdAt: -1 });

    if (posts.length === 0) {
      return res.json([]);
    }

    const counts = await Promise.all(
      posts.map((p) => Comment.countDocuments({ post: p._id }))
    );
    const mappedPosts = posts.map((post, idx) => ({
      ...post.toObject(),
      comments: counts[idx] || 0,
      author: {
        username: "Anonymous",
        name: "Anonymous",
        avatar: "",
        _id: undefined,
      },
    }));
    res.json(mappedPosts);
  } catch (err) {
    console.error("Whistle blow posts error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const filter = { author: req.params.id };

    if (req.query.excludeWhistle === "true") {
      filter.anonymous = { $ne: true };
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const posts = await Post.find(filter)
      .populate("author", "username name avatar")
      .populate({
        path: "repostOf",
        populate: { path: "author", select: "username name avatar" },
      })
      .sort({ createdAt: -1 });

    const counts = await Promise.all(
      posts.map((p) => Comment.countDocuments({ post: p._id }))
    );
    const mappedPosts = posts.map((post, idx) => {
      if (post.anonymous) {
        return {
          ...post.toObject(),
          comments: counts[idx] || 0,
          author: {
            username: "Anonymous",
            name: "Anonymous",
            avatar: "",
            _id: undefined,
          },
        };
      }
      return { ...post.toObject(), comments: counts[idx] || 0 };
    });

    res.json(mappedPosts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.createPost = async (req, res) => {
  try {
    let {
      title,
      content,
      category,
      author,
      anonymous,
      anonymousId,
      repostOf,
      community,
      visibility,
      selectedHashtags,
    } = req.body;
    if (req.body.anonymous === "true" || req.body.anonymous === true)
      anonymous = true;
    let image = undefined;
    let proofImages = [];

    if (req.files && req.files.image && req.files.image[0]) {
      image = {
        url: req.files.image[0].path,
        publicId: req.files.image[0].filename,
      };
    }

    if (req.files && req.files.proofImages) {
      proofImages = req.files.proofImages.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    const hashtagRegex = /#(\w+)/g;
    let contentHashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      contentHashtags.push(match[1].toLowerCase());
    }

    let selectedHashtagsArray = [];
    if (selectedHashtags) {
      if (typeof selectedHashtags === 'string') {
        selectedHashtagsArray = selectedHashtags.split(',').map(tag => tag.trim().toLowerCase());
      } else if (Array.isArray(selectedHashtags)) {
        selectedHashtagsArray = selectedHashtags.map(tag => tag.trim().toLowerCase());
      }
    }

    let allHashtags = [...contentHashtags, ...selectedHashtagsArray];
    let settings = await GlobalSettings.findOne();
    const allowedTags = settings
      ? settings.tags.map((t) => t.toLowerCase())
      : [];
    
    let hashtags = [...new Set(allHashtags)].filter((tag) => allowedTags.includes(tag));

    if (community) {
      const Community = require("../models/Community");
      const communityDoc = await Community.findById(community);
      if (!communityDoc) {
        return res.status(400).json({ error: "Community not found." });
      }
      const validCategory = communityDoc.categories.some(
        (cat) => cat.name === category
      );
      if (!validCategory) {
        return res
          .status(400)
          .json({ error: "Invalid category for this community." });
      }
    }

    let postData;
    if (anonymous === true) {
      postData = {
        title,
        content,
        category,
        anonymous: true,
        anonymousId,
        image,
        proofImages,
        repostOf,
        hashtags,
        visibility: visibility || "public",
      };
    } else {
      postData = {
        title,
        content,
        category,
        author,
        image,
        repostOf,
        hashtags,
        visibility: visibility || "public",
      };
    }

    if (community) {
      postData.community = community;
      postData.isCommunityPost = true;
      postData.visibility = "community";
    }

    if (!content || !category || (anonymous !== true && !author)) {
      return res
        .status(400)
        .json({ error: "Content, category, and author are required." });
    }
    if (anonymous === true && req.originalUrl && req.originalUrl.includes('/posts/whistle-blow')) {
      const WhistleSubmission = require('../models/WhistleSubmission');
      const submission = new WhistleSubmission({
        ...postData,
        submittedBy: author || undefined,
      });
      await submission.save();
      const { createNotification } = require('./notificationController');
      const ADMIN_EMAIL = process.env.EMAIL_USER;
      const User = require('../models/User');
      try {
        if (author) {
          await createNotification(
            author,
            'whistle_pending',
            'Your whistle has been sent to admin for approval. You will be notified once reviewed.',
            null,
            null,
            null,
            { submissionId: submission._id }
          );
        }
        if (ADMIN_EMAIL) {
          const adminUser = await User.findOne({ email: ADMIN_EMAIL });
          if (adminUser) {
            await createNotification(
              adminUser._id,
              'whistle_review',
              `${author ? 'A user' : 'An anonymous user'} submitted a whistle for review`,
              author || null,
              null,
              null,
              { submissionId: submission._id }
            );
          }
        }
      } catch (e) {}
      return res.status(202).json({ success: true, pending: true, submissionId: submission._id });
    }

    const post = new Post(postData);
    await post.save();
    try {
      const io = req.app.get("io");
      if (io) {
        const totalComments = await Comment.countDocuments({ post: post._id });
        io.emit("post_updated", {
          postId: post._id,
          likes: Array.isArray(post.likes) ? post.likes.length : 0,
          shares: post.shares || 0,
          comments: totalComments,
          reposts: post.reposts || 0,
        });
      }
    } catch (e) {}

    if (community) {
      const Community = require("../models/Community");
      await Community.findByIdAndUpdate(community, {
        $inc: { postCount: 1 },
      });
    }

    await post.populate("author", "name username avatar");

    if (repostOf) {
      const originalPost = await Post.findById(repostOf);
      if (originalPost) {
        originalPost.reposts += 1;
        await originalPost.save();
        const io = req.app.get("io");
        if (io) {
          const totalComments = await Comment.countDocuments({ post: originalPost._id });
          io.emit("post_updated", {
            postId: originalPost._id,
            likes: Array.isArray(originalPost.likes) ? originalPost.likes.length : 0,
            shares: originalPost.shares || 0,
            comments: totalComments,
            reposts: originalPost.reposts || 0,
          });
        }
      }
    }

  try {
    const isCommunity = !!community;
    const userQuery = { interests: { $exists: true, $ne: [] } };
    let candidateUsers = await User.find(userQuery).select('interests _id');

    if (isCommunity) {
      const Community = require('../models/Community');
      const communityDoc = await Community.findById(community).select('members');
      const memberIdSet = new Set((communityDoc?.members || []).map(id => id.toString()));
      candidateUsers = candidateUsers.filter(u => memberIdSet.has(u._id.toString()));
    }

    const lowerHashtags = (post.hashtags || hashtags || []).map(h => h.toLowerCase());
    const lowerCategory = category ? category.toLowerCase() : null;

    const recipients = candidateUsers.filter(u => {
      const interestsLower = (u.interests || []).map(i => i.toLowerCase());
      const hasTagMatch = lowerHashtags.some(t => interestsLower.includes(t));
      const hasCategoryMatch = lowerCategory ? interestsLower.includes(lowerCategory) : false;
      return hasTagMatch || hasCategoryMatch;
    }).filter(u => {
      if (!post.anonymous && author && u._id.toString() === String(author)) return false;
      return true;
    });

    const displayName = post.anonymous ? 'Anonymous' : (post.author?.username || post.author?.name || 'Someone');
    const titleForMsg = title || (post.content ? post.content.slice(0, 60) : 'New post');
    for (const recipient of recipients) {
      await createNotification(
        recipient._id,
        'interest_match',
        `${displayName} posted: ${titleForMsg}`,
        post.anonymous ? null : (post.author?._id || author || null),
        post._id,
        null,
        { isCommunityPost: !!post.isCommunityPost }
      );
    }
  } catch (notifyErr) {
  }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);

      if (post.author && post.author.toString() !== userId && !post.anonymous) {
        const liker = await User.findById(userId);
        const message = `${liker?.name || "Someone"} liked your post`;
        await createNotification(
          post.author,
          "like",
          message,
          userId,
          post._id
        );
      }
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();

    const io = req.app.get("io");
    if (io) {
      const totalComments = await Comment.countDocuments({ post: post._id });
      io.emit("post_liked", {
        postId: post._id,
        likes: post.likes.length,
        liked: index === -1,
      });
      io.emit("post_updated", {
        postId: post._id,
        likes: post.likes.length,
        shares: post.shares || 0,
        comments: totalComments,
        reposts: post.reposts || 0,
      });
    }

    res.json({ likes: post.likes.length, liked: index === -1 });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.shares += 1;
    await post.save();

    const io = req.app.get("io");
    if (io) {
      const totalComments = await Comment.countDocuments({ post: post._id });
      io.emit("post_shared", {
        postId: post._id,
        shares: post.shares,
      });
      io.emit("post_updated", {
        postId: post._id,
        likes: Array.isArray(post.likes) ? post.likes.length : 0,
        shares: post.shares || 0,
        comments: totalComments,
        reposts: post.reposts || 0,
      });
    }

    res.json({ shares: post.shares });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteRepost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.repostOf) {
      const originalPost = await Post.findById(post.repostOf);
      if (originalPost && originalPost.reposts > 0) {
        originalPost.reposts -= 1;
        await originalPost.save();
      }
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { userId, text, parent } = req.body;
    if (!userId || !text)
      return res.status(400).json({ error: "userId and text required" });
    const comment = new Comment({
      post: req.params.id,
      user: userId,
      text,
      parent: parent || null,
    });
    await comment.save();

    const post = await Post.findById(req.params.id);
    if (
      post &&
      !post.anonymous &&
      post.author &&
      post.author.toString() !== userId
    ) {
      const commenter = await User.findById(userId);
      const message = `${commenter?.name || "Someone"} commented on your post`;
      await createNotification(
        post.author,
        "comment",
        message,
        userId,
        post._id,
        comment._id
      );
    }
    if (parent) {
      const parentComment = await Comment.findById(parent);
      if (
        parentComment &&
        parentComment.user.toString() !== userId &&
        !post.anonymous &&
        parentComment.user.toString() !== post.author?.toString()
      ) {
        const replier = await User.findById(userId);
        const message = `${replier?.name || "Someone"} replied to your comment`;
        await createNotification(
          parentComment.user,
          "reply",
          message,
          userId,
          post._id,
          comment._id
        );
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("comment_added", {
        postId: req.params.id,
        commentId: comment._id,
        commentCount: await Comment.countDocuments({ post: req.params.id }),
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getComments = async (req, res) => {
  try {
    const allComments = await Comment.find({ post: req.params.id })
      .populate("user", "username name avatar")
      .sort({ createdAt: -1 });
    const comments = allComments.filter((c) => !c.parent);
    const replies = allComments.filter((c) => c.parent);
    const commentsWithReplies = comments.map((comment) => {
      const commentObj = comment.toObject();
      commentObj.replies = replies.filter(
        (r) => r.parent && r.parent.toString() === comment._id.toString()
      );
      return commentObj;
    });
    res.json(commentsWithReplies);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getFollowingFeed = async (req, res) => {
  try {
    const userId = req.params.userId;
    const User = require("../models/User");
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const filter = { author: { $in: user.following } };

    if (req.query.excludeWhistle === "true") {
      filter.anonymous = { $ne: true };
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const posts = await Post.find(filter)
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 });
    const counts = await Promise.all(
      posts.map((p) => Comment.countDocuments({ post: p._id }))
    );
    const mappedPosts = posts.map((post, idx) => {
      if (post.anonymous) {
        return {
          ...post.toObject(),
          comments: counts[idx] || 0,
          author: {
            username: "Anonymous",
            name: "Anonymous",
            avatar: "",
            _id: undefined,
          },
        };
      }
      return { ...post.toObject(), comments: counts[idx] || 0 };
    });
    res.json(mappedPosts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
  
exports.getHotrisingFeed = async (req, res) => {
  try {
    const filter = {};

    if (req.query.excludeWhistle === "true") {
      filter.anonymous = { $ne: true };
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const posts = await Post.find(filter)
      .populate("author", "username name avatar followers")
      .sort({ createdAt: -1 });

    if (posts.length === 0) {
      return res.json([]);
    }

    const postsWithRatio = posts.map(post => {
      const postObj = post.toObject();
      const likeCount = post.likes ? post.likes.length : 0;
      const followerCount = post.author?.followers ? post.author.followers.length : 1;
      const ratio = followerCount > 0 ? likeCount / followerCount : likeCount;
      return { ...postObj, hotrisingRatio: ratio };
    });

    postsWithRatio.sort((a, b) => b.hotrisingRatio - a.hotrisingRatio);

    const counts = await Promise.all(
      postsWithRatio.map((p) => Comment.countDocuments({ post: p._id }))
    );
    const mappedPosts = postsWithRatio.map((post, idx) => {
      if (post.anonymous) {
        return {
          ...post,
          comments: counts[idx] || 0,
          author: {
            username: "Anonymous",
            name: "Anonymous",
            avatar: "",
            _id: undefined,
          },
        };
      }
      return { ...post, comments: counts[idx] || 0 };
    });
    res.json(mappedPosts);
  } catch (err) {
    console.error("Hotrising feed error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostImage = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.image || !post.image.url) {
      return res.status(404).send("Image not found");
    }
    res.redirect(post.image.url);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.getProofImage = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const idx = parseInt(req.params.idx, 10);
    if (
      !post ||
      !post.proofImages ||
      !post.proofImages[idx] ||
      !post.proofImages[idx].url
    ) {
      return res.status(404).send("Proof image not found");
    }
    res.redirect(post.proofImages[idx].url);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!post.anonymous) {
      if (!req.body.userId || post.author.toString() !== req.body.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
    } else {
      if (!req.body.anonymousId || post.anonymousId !== req.body.anonymousId) {
        return res.status(403).json({ error: "Not authorized" });
      }
    }
    await post.deleteOne();
    const io = req.app.get("io");
    if (io) {
      io.emit("post_updated", {
        postId: req.params.id,
        likes: 0,
        shares: 0,
        comments: 0,
        reposts: 0,
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAvailableHashtags = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = new GlobalSettings({ tags: [] });
      await settings.save();
    }
    
    res.json({ hashtags: settings.tags });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username name avatar")
      .populate({
        path: "repostOf",
        populate: { path: "author", select: "username name avatar" },
      })
      .populate("community", "name");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.anonymous) {
      const mappedPost = {
        ...post.toObject(),
        author: {
          username: "Anonymous",
          name: "Anonymous",
          avatar: "",
          _id: undefined,
        },
      };
      return res.json(mappedPost);
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


exports.getShareLink = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const shareLink = await DynamicLinkService.createPostLinkWithFallback(post._id);
    
    res.json({ link: shareLink });
  } catch (err) {
    console.error('Error generating share link:', err);
    const fallbackLink = `https://sluglime.page.link/post/${req.params.id}`;
    res.json({ link: fallbackLink });
  }
};

exports.getPendingWhistles = async (req, res) => {
  try {
    const { userId, anonymousId } = req.query;
    const filter = {};
    if (userId) filter.submittedBy = userId;
    if (anonymousId) filter.anonymousId = anonymousId;
    if (!userId && !anonymousId) {
      return res.status(400).json({ error: 'userId or anonymousId is required' });
    }
    const submissions = await WhistleSubmission.find(filter)
      .populate('community', 'name')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
