const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ApiError = require('../utils/apiError');

/**
 * Format comment document for client consumption
 * @param {Object} comment
 * @param {string} [currentUserId]
 * @returns {Object}
 */
const formatComment = (comment, currentUserId = null) => {
  const commentObj = comment.toObject ? comment.toObject() : { ...comment };
  const isOwner = currentUserId && commentObj.author
    ? String(commentObj.author._id || commentObj.author) === String(currentUserId)
    : false;

  return {
    _id: commentObj._id,
    post: commentObj.post,
    content: commentObj.content,
    author: commentObj.author,
    isOwner,
    createdAt: commentObj.createdAt
  };
};

/**
 * Create a new comment on a post
 * @param {string} postId
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createComment = async (postId, userId, { content }) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content
  });

  // Increment comments count atomically on post
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  await comment.populate('author', 'username name avatar');
  return formatComment(comment, userId);
};

/**
 * Retrieve comments for a post
 * @param {string} postId
 * @param {string} [currentUserId]
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<{ comments: Array, pagination: Object }>}
 */
const getCommentsByPost = async (postId, currentUserId = null, page = 1, limit = 20) => {
  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    throw ApiError.notFound('Post not found');
  }

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar'),
    Comment.countDocuments({ post: postId })
  ]);

  return {
    comments: comments.map((c) => formatComment(c, currentUserId)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Delete a comment
 * @param {string} commentId
 * @param {string} currentUserId
 * @returns {Promise<void>}
 */
const deleteComment = async (commentId, currentUserId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  const post = await Post.findById(comment.post);

  // Allow either comment author or original post author to remove comment
  const isCommentAuthor = String(comment.author) === String(currentUserId);
  const isPostAuthor = post && String(post.author) === String(currentUserId);

  if (!isCommentAuthor && !isPostAuthor) {
    throw ApiError.forbidden('You are not authorized to delete this comment');
  }

  await Promise.all([
    Comment.findByIdAndDelete(commentId),
    Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } })
  ]);
};

module.exports = {
  createComment,
  getCommentsByPost,
  deleteComment
};
