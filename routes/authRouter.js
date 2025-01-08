// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validateUser');
const restrictQuery = require('../middlewares/restrictQuery');

// Public routes

// http://localhost:3000/auth/register
router.post('/register', validateRegister ,registerUser);

// http://localhost:3000/auth/login
router.post('/login', validateLogin ,loginUser);

// Protected route
// http://localhost:3000/auth/profile
router.get('/profile', restrictQuery(['name', 'email']) ,protect, getUserProfile);

module.exports = router;
