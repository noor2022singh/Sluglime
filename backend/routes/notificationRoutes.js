const express = require('express');
const router = express.Router();
const { getNotifications, markRead, createSampleNotifications, clearAllNotifications, testNotification } = require('../controllers/notificationController');

router.get('/', getNotifications);
router.post('/mark-read', markRead);
router.post('/create-sample', createSampleNotifications);
router.post('/clear-all', clearAllNotifications);
router.post('/test', testNotification);

module.exports = router; 