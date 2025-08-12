const express = require('express');
const router = express.Router();
const { register, login, changeEmail, changePassword, verifyEmail, changeEmailWithVerification, verifyEmailChange, forgotPassword, resetPassword } = require('../controllers/authController');
const { uploadAvatar } = require('../config/cloudinary');

router.post('/register', uploadAvatar.single('avatar'), register);
router.post('/login', login);

router.post('/change-email', changeEmail);
router.post('/change-email-with-verification', changeEmailWithVerification);
router.post('/change-password', changePassword);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/verify-email/:token', verifyEmail);
router.get('/verify-email-change/:token', verifyEmailChange);

module.exports = router;
