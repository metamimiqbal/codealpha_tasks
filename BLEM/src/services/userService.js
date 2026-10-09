const User = require('../models/User');
const Post = require('../models/Post');
const ApiError = require('../utils/apiError');

/**
 * Retrieve user public profile by username
 * @param {string} username
 * @param {string} [currentUserId]
 * @returns {Promise<Object>}
 */
const getProfileByUsername = async (username, currentUserId = null) => {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    throw ApiError.notFound(`User '@${username}' not found`);
  }

  const postsCount = await Post.countDocuments({ author: user._id });

  const isSelf = currentUserId ? String(user._id) === String(currentUserId) : false;
  const isFollowing = currentUserId
    ? user.followers.some((id) => String(id) === String(currentUserId))
    : false;

  return {
    _id: user._id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
    followersCount: user.followers.length,
    followingCount: user.following.length,
    postsCount,
    isFollowing,
    isSelf
  };
};

/**
 * Update authenticated user's profile details
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateProfile = async (userId, updateData) => {
  const allowedUpdates = ['name', 'bio', 'avatar'];
  const updates = {};

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    returnDocument: 'after',
    runValidators: true
  });

  if (!updatedUser) {
    throw ApiError.notFound('User not found');
  }

  const userObj = updatedUser.toJSON();
  userObj.followersCount = updatedUser.followers ? updatedUser.followers.length : 0;
  userObj.followingCount = updatedUser.following ? updatedUser.following.length : 0;

  return userObj;
};

/**
 * Follow a user
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<{ isFollowing: boolean, followersCount: number }>}
 */
const followUser = async (currentUserId, targetUserId) => {
  if (String(currentUserId) === String(targetUserId)) {
    throw ApiError.badRequest('You cannot follow yourself');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('User to follow not found');
  }

  // Atomically add to following and followers arrays
  await Promise.all([
    User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }),
    User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } })
  ]);

  const updatedTarget = await User.findById(targetUserId).select('followers');

  return {
    isFollowing: true,
    followersCount: updatedTarget ? updatedTarget.followers.length : 0
  };
};

/**
 * Unfollow a user
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<{ isFollowing: boolean, followersCount: number }>}
 */
const unfollowUser = async (currentUserId, targetUserId) => {
  if (String(currentUserId) === String(targetUserId)) {
    throw ApiError.badRequest('You cannot unfollow yourself');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('User to unfollow not found');
  }

  // Atomically remove from following and followers arrays
  await Promise.all([
    User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
    User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } })
  ]);

  const updatedTarget = await User.findById(targetUserId).select('followers');

  return {
    isFollowing: false,
    followersCount: updatedTarget ? updatedTarget.followers.length : 0
  };
};

/**
 * Search or suggest users
 * @param {string} query
 * @param {string} [currentUserId]
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
const searchUsers = async (query = '', currentUserId = null, limit = 10) => {
  const filter = {};
  if (query && query.trim()) {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { username: { $regex: escaped, $options: 'i' } },
      { name: { $regex: escaped, $options: 'i' } }
    ];
  }

  if (currentUserId) {
    filter._id = { $ne: currentUserId };
  }

  const users = await User.find(filter)
    .select('username name avatar bio followers following createdAt')
    .limit(limit);

  return users.map((u) => ({
    _id: u._id,
    username: u.username,
    name: u.name,
    avatar: u.avatar,
    bio: u.bio,
    followersCount: u.followers ? u.followers.length : 0,
    followingCount: u.following ? u.following.length : 0,
    isFollowing: currentUserId
      ? u.followers.some((f) => String(f) === String(currentUserId))
      : false
  }));
};

module.exports = {
  getProfileByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers
};
