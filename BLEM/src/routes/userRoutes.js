const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, validateObjectId } = require('../middleware/validate');

const router = express.Router();

// Search / list users
router.get('/search', optionalAuth, userController.searchUsers);

// Public profile by username
router.get('/profile/:username', optionalAuth, userController.getProfile);

// Update own profile
router.patch('/profile', authenticate, validateProfileUpdate, userController.updateProfile);

// Follow / unfollow user by user ID
router.post('/:id/follow', authenticate, validateObjectId('id'), userController.followUser);
router.delete('/:id/follow', authenticate, validateObjectId('id'), userController.unfollowUser);

module.exports = router;
