const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Format a post document for client consumption
 * @param {Object} post
 * @param {string} [currentUserId]
 * @returns {Object}
 */
const formatPost = (post, currentUserId = null) => {
  const postObj = post.toObject ? post.toObject() : { ...post };
  const likesList = postObj.likes || [];
  const hasLiked = currentUserId
    ? likesList.some((id) => String(id) === String(currentUserId))
    : false;
  const isOwner = currentUserId && postObj.author
    ? String(postObj.author._id || postObj.author) === String(currentUserId)
    : false;

  return {
    _id: postObj._id,
    content: postObj.content,
    author: postObj.author,
    likesCount: likesList.length,
    commentsCount: postObj.commentsCount || 0,
    hasLiked,
    isOwner,
    createdAt: postObj.createdAt,
    updatedAt: postObj.updatedAt
  };
};

/**
 * Create a new post
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createPost = async (userId, { content }) => {
  const post = await Post.create({
    author: userId,
    content
  });

  await post.populate('author', 'username name avatar');
  return formatPost(post, userId);
};

/**
 * Get single post by ID
 * @param {string} postId
 * @param {string} [currentUserId]
 * @returns {Promise<Object>}
 */
const getPostById = async (postId, currentUserId = null) => {
  const post = await Post.findById(postId).populate('author', 'username name avatar');
  if (!post) {
    throw ApiError.notFound('Post not found');
  }
  return formatPost(post, currentUserId);
};

/**
 * Delete a post (only allowed for the author)
 * @param {string} postId
 * @param {string} currentUserId
 * @returns {Promise<void>}
 */
const deletePost = async (postId, currentUserId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  if (String(post.author) !== String(currentUserId)) {
    throw ApiError.forbidden('You are not authorized to delete this post');
  }

  // Delete post and cleanup associated comments
  await Promise.all([
    Post.findByIdAndDelete(postId),
    Comment.deleteMany({ post: postId })
  ]);
};

/**
 * Toggle like/unlike on a post
 * @param {string} postId
 * @param {string} currentUserId
 * @returns {Promise<{ liked: boolean, likesCount: number }>}
 */
const toggleLike = async (postId, currentUserId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const alreadyLiked = post.likes.some((id) => String(id) === String(currentUserId));
  let updateOperation;

  if (alreadyLiked) {
    updateOperation = { $pull: { likes: currentUserId } };
  } else {
    updateOperation = { $addToSet: { likes: currentUserId } };
  }

  const updatedPost = await Post.findByIdAndUpdate(postId, updateOperation, { returnDocument: 'after' });

  return {
    liked: !alreadyLiked,
    likesCount: updatedPost.likes.length
  };
};

/**
 * Get posts by a specific user
 * @param {string} targetUserId
 * @param {string} [currentUserId]
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<{ posts: Array, pagination: Object }>}
 */
const getUserPosts = async (targetUserId, currentUserId = null, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [posts, totalPosts] = await Promise.all([
    Post.find({ author: targetUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar'),
    Post.countDocuments({ author: targetUserId })
  ]);

  return {
    posts: posts.map((p) => formatPost(p, currentUserId)),
    pagination: {
      total: totalPosts,
      page,
      limit,
      totalPages: Math.ceil(totalPosts / limit) || 1
    }
  };
};

/**
 * Retrieve personalized home feed or global explore feed
 * @param {string|null} currentUserId
 * @param {Object} options
 * @returns {Promise<{ posts: Array, pagination: Object, feedType: string }>}
 */
const getFeed = async (currentUserId, { page = 1, limit = 10, feedType = 'home' } = {}) => {
  const skip = (page - 1) * limit;
  let filter = {};
  let effectiveFeedType = feedType;

  if (feedType === 'home' && currentUserId) {
    const user = await User.findById(currentUserId).select('following');
    const followingIds = user && user.following ? user.following : [];
    // Author is either followed user or the current user themselves
    const feedAuthors = [...followingIds, currentUserId];
    filter = { author: { $in: feedAuthors } };

    // Check if user has posts in feed; if not, check if any exist at all
    const feedCount = await Post.countDocuments(filter);
    if (feedCount === 0) {
      // Empty personalized feed: fallback to explore so user immediately sees activity
      filter = {};
      effectiveFeedType = 'explore_fallback';
    }
  }

  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar'),
    Post.countDocuments(filter)
  ]);

  return {
    posts: posts.map((p) => formatPost(p, currentUserId)),
    feedType: effectiveFeedType,
    pagination: {
      total: totalPosts,
      page,
      limit,
      totalPages: Math.ceil(totalPosts / limit) || 1
    }
  };
};

module.exports = {
  createPost,
  getPostById,
  deletePost,
  toggleLike,
  getUserPosts,
  getFeed
};
