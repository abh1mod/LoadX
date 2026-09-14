const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Rate limiting for auth endpoints (max 30 requests per minute)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, upload.any(), authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
