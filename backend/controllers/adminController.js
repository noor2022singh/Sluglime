const GlobalSettings = require('../models/GlobalSettings');
const User = require('../models/User');
const Post = require('../models/Post');
const WhistleSubmission = require('../models/WhistleSubmission');

const ADMIN_EMAIL = process.env.EMAIL_USER;

const isAdmin = async (req, res, next) => {
    try {
        const userEmail = req.headers['user-email'];
        if (!userEmail || userEmail !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHashtags = async (req, res) => {
    try {
        const userEmail = req.headers['user-email'];
        if (!userEmail || userEmail !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Admin access required' });
        }

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

exports.addHashtag = async (req, res) => {
    try {
        const userEmail = req.headers['user-email'];
        if (!userEmail || userEmail !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { tag } = req.body;
        if (!tag || typeof tag !== 'string') {
            return res.status(400).json({ error: 'Valid tag required' });
        }

        const cleanTag = tag.trim().toLowerCase();
        if (!cleanTag) {
            return res.status(400).json({ error: 'Valid tag required' });
        }

        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings({ tags: [] });
        }

        if (settings.tags.includes(cleanTag)) {
            return res.status(400).json({ error: 'Tag already exists' });
        }

        settings.tags.push(cleanTag);
        await settings.save();

        res.json({ hashtags: settings.tags, message: 'Hashtag added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.removeHashtag = async (req, res) => {
    try {
        const userEmail = req.headers['user-email'];
        if (!userEmail || userEmail !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { tag } = req.params;
        if (!tag) {
            return res.status(400).json({ error: 'Tag required' });
        }

        const cleanTag = tag.trim().toLowerCase();
        let settings = await GlobalSettings.findOne();
        
        if (!settings) {
            return res.status(404).json({ error: 'No settings found' });
        }

        const tagIndex = settings.tags.indexOf(cleanTag);
        if (tagIndex === -1) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        settings.tags.splice(tagIndex, 1);
        await settings.save();

        res.json({ hashtags: settings.tags, message: 'Hashtag removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getWhistleSubmissions = async (req, res) => {
  try {
    const userEmail = req.headers['user-email'];
    if (!userEmail || userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const submissions = await WhistleSubmission.find()
      .populate('community', 'name')
      .populate('submittedBy', 'name username avatar email')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.reviewWhistle = async (req, res) => {
  try {
    const userEmail = req.headers['user-email'];
    if (!userEmail || userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    const { action } = req.body; 
    const submission = await WhistleSubmission.findById(id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const { createNotification } = require('./notificationController');
    if (action === 'approve') {
      const post = new Post({
        title: submission.title,
        content: submission.content,
        category: submission.category,
        anonymous: true,
        anonymousId: submission.anonymousId,
        image: submission.image,
        proofImages: submission.proofImages,
        hashtags: submission.hashtags,
        visibility: submission.visibility || 'public',
        community: submission.community,
        isCommunityPost: submission.isCommunityPost,
      });
      await post.save();
      try {
        const User = require('../models/User');
        const Community = require('../models/Community');
        const isCommunity = !!post.community;
        let candidateUsers = await User.find({ interests: { $exists: true, $ne: [] } }).select('interests _id');
        if (isCommunity) {
          const communityDoc = await Community.findById(post.community).select('members');
          const memberIdSet = new Set((communityDoc?.members || []).map(id => id.toString()));
          candidateUsers = candidateUsers.filter(u => memberIdSet.has(u._id.toString()));
        }
        const lowerHashtags = (post.hashtags || []).map(h => h.toLowerCase());
        const lowerCategory = post.category ? post.category.toLowerCase() : null;
        const recipients = candidateUsers.filter(u => {
          const interestsLower = (u.interests || []).map(i => i.toLowerCase());
          const hasTagMatch = lowerHashtags.some(t => interestsLower.includes(t));
          const hasCategoryMatch = lowerCategory ? interestsLower.includes(lowerCategory) : false;
          return hasTagMatch || hasCategoryMatch;
        });
        const displayName = 'Anonymous';
        const titleForMsg = post.title || (post.content ? post.content.slice(0, 60) : 'New whistle');
        for (const recipient of recipients) {
          await createNotification(
            recipient._id,
            'interest_match',
            `${displayName} posted: ${titleForMsg}`,
            null,
            post._id,
            null,
            { isCommunityPost: !!post.isCommunityPost }
          );
        }
      } catch (e) {}
      if (submission.submittedBy) {
        await createNotification(
          submission.submittedBy,
          'whistle_approved',
          'Your whistle has been approved and published.',
          null,
          post._id,
          null,
          { submissionId: submission._id }
        );
      }
      await submission.deleteOne();
      return res.json({ success: true, approved: true, postId: post._id });
    } else if (action === 'reject') {
      if (submission.submittedBy) {
        await createNotification(
          submission.submittedBy,
          'whistle_rejected',
          'Your whistle was rejected by admin and was not published.',
          null,
          null,
          null,
          { submissionId: submission._id }
        );
      }
      await submission.deleteOne();
      return res.json({ success: true, approved: false });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
