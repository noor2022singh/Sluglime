const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    tags: [{ type: String, trim: true }],
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
