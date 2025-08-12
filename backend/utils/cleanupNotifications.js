const Notification = require('../models/Notification');

async function cleanupOldNotifications() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Notification.deleteMany({
            createdAt: { $lt: twentyFourHoursAgo }
        });
        
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
    }
}

function startCleanupScheduler() {
    cleanupOldNotifications();
    setInterval(cleanupOldNotifications, 60 * 60 * 1000);
}

module.exports = {
    cleanupOldNotifications,
    startCleanupScheduler
}; 