const mongoose = require('mongoose');

const whistleSubmissionSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  content: { type: String, required: true },
  category: { type: String, required: true, default: 'news' },
  image: {
    url: String,
    publicId: String,
  },
  proofImages: [
    {
      url: String,
      publicId: String,
    },
  ],
  anonymous: { type: Boolean, default: true },
  anonymousId: { type: String, required: true },
  hashtags: [{ type: String }],
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  isCommunityPost: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'community', 'private'], default: 'public' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WhistleSubmission', whistleSubmissionSchema);


