const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: {
        type: String,
        default: 'news',
        required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 },
    image: {
        url: String,
        publicId: String,
    },
    proofImages: [
        {
            url: String,
            publicId: String,
        }
    ],
    anonymous: { type: Boolean, default: false },
    anonymousId: { type: String, default: '' },
    hidden: { type: Boolean, default: false },
    repostOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    hashtags: [{ type: String }],
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    isCommunityPost: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'community', 'private'], default: 'public' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', postSchema); 