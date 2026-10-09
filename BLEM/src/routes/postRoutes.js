const express = require('express');
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validatePostCreate, validateObjectId } = require('../middleware/validate');

const router = express.Router();

// Create new post
router.post('/', authenticate, validatePostCreate, postController.createPost);

// Feed (home feed with followed users, or explore)
router.get('/feed', optionalAuth, postController.getFeed);

// User's timeline
router.get('/user/:userId', optionalAuth, validateObjectId('userId'), postController.getUserPosts);

// Single post by ID
router.get('/:id', optionalAuth, validateObjectId('id'), postController.getPostById);

// Delete post by ID (author only)
router.delete('/:id', authenticate, validateObjectId('id'), postController.deletePost);

// Toggle like / unlike post
router.post('/:id/like', authenticate, validateObjectId('id'), postController.toggleLike);

module.exports = router;
