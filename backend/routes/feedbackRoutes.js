const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.post('/submit', feedbackController.submitFeedback);

router.get('/', feedbackController.getAllFeedbacks);

router.delete('/:id', feedbackController.deleteFeedback);

router.delete('/', feedbackController.deleteAllFeedbacks);

module.exports = router; 