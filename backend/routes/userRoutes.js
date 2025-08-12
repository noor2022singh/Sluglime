const express = require('express');
const router = express.Router();
const { uploadAvatar: uploadAvatarMiddleware } = require('../config/cloudinary');
const { getUserProfile, updateUserProfile, subscribeUser, followUser, unfollowUser, getFollowers, getFollowing, uploadAvatar, uploadBanner } = require('../controllers/userController');
const { getPostsByUser } = require('../controllers/postController');

router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.get('/:id/posts', getPostsByUser);
router.post('/:id/subscribe', subscribeUser);
router.post('/:id/follow', followUser);
router.post('/:id/unfollow', unfollowUser);
router.post('/:id/avatar', uploadAvatarMiddleware.single('avatar'), uploadAvatar);
router.post('/:id/banner', uploadAvatarMiddleware.single('banner'), uploadBanner);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router; 