const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

feedbackSchema.index({ timestamp: -1 });
feedbackSchema.index({ userId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema); 