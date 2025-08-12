const mongoose = require('mongoose');

const communityRequestSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    message: {
        type: String,
        default: ''
    }
}, { timestamps: true });

communityRequestSchema.index({ community: 1, user: 1 }, { unique: true });
communityRequestSchema.index({ status: 1 });
communityRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityRequest', communityRequestSchema); 