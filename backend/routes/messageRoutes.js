const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getUserConversations, markAsRead, getUnreadCount, sendImage } = require('../controllers/messageController');

router.post('/send', sendMessage);
router.post('/send-image', sendImage);
router.get('/conversation/:userId1/:userId2', getConversation);
router.get('/conversations/:userId', getUserConversations);
router.post('/mark-read', markAsRead);
router.get('/unread/:userId', getUnreadCount);

module.exports = router; 