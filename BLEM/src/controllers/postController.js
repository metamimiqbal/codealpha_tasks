const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const postService = require('../services/postService');

/**
 * Create a new post
 */
const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body);
  return ApiResponse.created(res, 'Post published successfully', { post });
});

/**
 * Get a specific post by ID
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(
    req.params.id,
    req.user ? req.user._id : null
  );
  return ApiResponse.success(res, 200, 'Post retrieved successfully', { post });
});

/**
 * Delete a post
 */
const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.params.id, req.user._id);
  return ApiResponse.success(res, 200, 'Post deleted successfully');
});

/**
 * Like or unlike a post
 */
const toggleLike = asyncHandler(async (req, res) => {
  const result = await postService.toggleLike(req.params.id, req.user._id);
  const message = result.liked ? 'Post liked' : 'Post unliked';
  return ApiResponse.success(res, 200, message, result);
});

/**
 * Get all posts for a specific user
 */
const getUserPosts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  const result = await postService.getUserPosts(
    req.params.userId,
    req.user ? req.user._id : null,
    page,
    limit
  );

  return ApiResponse.success(res, 200, 'User posts retrieved successfully', result.posts, result.pagination);
});

/**
 * Get home feed or explore feed
 */
const getFeed = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const feedType = req.query.type === 'explore' ? 'explore' : 'home';

  const result = await postService.getFeed(
    req.user ? req.user._id : null,
    { page, limit, feedType }
  );

  return ApiResponse.success(
    res,
    200,
    'Feed retrieved successfully',
    { posts: result.posts, feedType: result.feedType },
    result.pagination
  );
});

module.exports = {
  createPost,
  getPostById,
  deletePost,
  toggleLike,
  getUserPosts,
  getFeed
};
