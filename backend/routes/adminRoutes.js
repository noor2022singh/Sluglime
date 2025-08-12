const express = require('express');
const router = express.Router();
const { getHashtags, addHashtag, removeHashtag, getWhistleSubmissions, reviewWhistle } = require('../controllers/adminController');

router.get('/hashtags', getHashtags);
router.post('/hashtags', addHashtag);
router.delete('/hashtags/:tag', removeHashtag);

router.get('/whistles', getWhistleSubmissions);
router.post('/whistles/:id/review', reviewWhistle);

module.exports = router;
