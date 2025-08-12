const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 16777216 
    },
    type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    imageUrl: {
        type: String,
        trim: true,
    },
    read: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, sender: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema); 