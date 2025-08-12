const express = require('express');
const router = express.Router();
const { getPosts, createPost, likePost, sharePost, addComment, getComments, getFollowingFeed, getHotrisingFeed, upload, getPostImage, uploadWhistle, getProofImage, deletePost, deleteRepost, getPostsByUser, getWhistleBlowPosts, getAvailableHashtags, getPostById, getShareLink, getPendingWhistles } = require('../controllers/postController');

router.get('/', getPosts);
router.get('/user/:id', getPostsByUser); 
router.get('/following/:userId', getFollowingFeed);
router.get('/hotrising', getHotrisingFeed);
router.get('/whistle-blow', getWhistleBlowPosts);
router.get('/hashtags', getAvailableHashtags);
router.get('/whistle-pending', getPendingWhistles);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }]), createPost);
router.post('/whistle-blow', uploadWhistle, createPost);
router.post('/:id/like', likePost);
router.post('/:id/share', sharePost);
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);
router.get('/:id/image', getPostImage);
router.get('/:id/proof/:idx', getProofImage);
router.delete('/:id', deletePost);
router.delete('/:id/repost', deleteRepost);
router.get('/:id/share-link', getShareLink);
router.get('/:id', getPostById);

module.exports = router; 