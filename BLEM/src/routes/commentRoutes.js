const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateCommentCreate, validateObjectId } = require('../middleware/validate');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', optionalAuth, validateObjectId('postId'), commentController.getPostComments);

// Add comment to a post
router.post('/post/:postId', authenticate, validateObjectId('postId'), validateCommentCreate, commentController.createComment);

// Delete comment by ID (author only)
router.delete('/:id', authenticate, validateObjectId('id'), commentController.deleteComment);

module.exports = router;
