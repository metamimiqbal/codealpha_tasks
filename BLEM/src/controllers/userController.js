const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const userService = require('../services/userService');

/**
 * Get public profile of a user by username
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfileByUsername(
    req.params.username,
    req.user ? req.user._id : null
  );
  return ApiResponse.success(res, 200, 'Profile retrieved successfully', profile);
});

/**
 * Update authenticated user's profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateProfile(req.user._id, req.body);
  return ApiResponse.success(res, 200, 'Profile updated successfully', { user: updatedUser });
});

/**
 * Follow another user
 */
const followUser = asyncHandler(async (req, res) => {
  const result = await userService.followUser(req.user._id, req.params.id);
  return ApiResponse.success(res, 200, 'User followed successfully', result);
});

/**
 * Unfollow another user
 */
const unfollowUser = asyncHandler(async (req, res) => {
  const result = await userService.unfollowUser(req.user._id, req.params.id);
  return ApiResponse.success(res, 200, 'User unfollowed successfully', result);
});

/**
 * Search/discover users
 */
const searchUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const users = await userService.searchUsers(
    req.query.q || '',
    req.user ? req.user._id : null,
    limit
  );
  return ApiResponse.success(res, 200, 'Users retrieved successfully', users);
});

module.exports = {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers
};
