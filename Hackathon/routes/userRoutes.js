const express = require('express');
const router = express.Router();
const { signup, login, getUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Private route
router.get('/dashboard', authMiddleware, getUser);

module.exports = router;
