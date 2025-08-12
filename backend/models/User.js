const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String, 
        default: '',
    },
    bannerImage: { type: String, default: '' }, 
    bio: { type: String, default: '' }, 
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    suspended: { type: Boolean, default: false },
    suspendedUntil: { type: Date, default: null },
    suspensionReason: { type: String, default: '' },
    interests: [{ type: String }],
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    pendingEmail: { type: String },
    online: { type: Boolean, default: false }, 
    lastSeen: { type: Date, default: Date.now }, 
    passwordResetToken: { type: String }, 
    passwordResetExpires: { type: Date }, 
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', userSchema); 