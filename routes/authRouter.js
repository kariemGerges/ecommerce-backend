// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes

// http://localhost:3000/auth/register
router.post('/register', registerUser);

// http://localhost:3000/auth/login
router.post('/login', loginUser);

// Protected route
// http://localhost:3000/auth/profile
router.get('/profile', protect, getUserProfile);

module.exports = router;
