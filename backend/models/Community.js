const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 30 },
    icon: { type: String, default: '' },
}, { _id: false });

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    banner: {
        type: String,
        default: ''
    },
    privacy: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    categories: [categorySchema],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    memberCount: {
        type: Number,
        default: 0
    },
    postCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    rules: [{
        type: String
    }],
    tags: [{
        type: String
    }],

}, { timestamps: true });

communitySchema.index({ privacy: 1 });
communitySchema.index({ memberCount: -1 });
communitySchema.index({ postCount: -1 });
communitySchema.index({ tags: 1 });

module.exports = mongoose.model('Community', communitySchema); 