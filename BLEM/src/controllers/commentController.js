const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const commentService = require('../services/commentService');

/**
 * Add a comment to a post
 */
const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(
    req.params.postId,
    req.user._id,
    req.body
  );
  return ApiResponse.created(res, 'Comment added successfully', { comment });
});

/**
 * Get all comments on a post
 */
const getPostComments = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const result = await commentService.getCommentsByPost(
    req.params.postId,
    req.user ? req.user._id : null,
    page,
    limit
  );

  return ApiResponse.success(res, 200, 'Comments retrieved successfully', result.comments, result.pagination);
});

/**
 * Delete a comment
 */
const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.params.id, req.user._id);
  return ApiResponse.success(res, 200, 'Comment deleted successfully');
});

module.exports = {
  createComment,
  getPostComments,
  deleteComment
};
