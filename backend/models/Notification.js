const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['like', 'comment', 'reply', 'follow', 'mention', 'community_request', 'community_approved', 'community_rejected', 'whistle_pending', 'whistle_review', 'whistle_approved', 'whistle_rejected', 'interest_match'] },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    metadata: { type: mongoose.Schema.Types.Mixed }, 
    createdAt: { type: Date, default: Date.now, expires: 86400 },
});

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 