const mongoose = require('mongoose');
const ReportSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    reason: { type: String, required: true },
    details: { type: String },
    postLink: { type: String }, 
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reporterEmail: { type: String },
    authorEmail: { type: String },
    status: { type: String, default: 'pending' },
    resolvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Report', ReportSchema); 