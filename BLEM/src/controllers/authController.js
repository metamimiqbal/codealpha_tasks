const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const authService = require('../services/authService');

/**
 * Handle user registration
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, name, bio, avatar } = req.body;
  const result = await authService.register({ username, email, password, name, bio, avatar });
  return ApiResponse.created(res, 'User registered successfully', result);
});

/**
 * Handle user login
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login(identifier, password);
  return ApiResponse.success(res, 200, 'Login successful', result);
});

/**
 * Get currently authenticated user details
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  return ApiResponse.success(res, 200, 'Current user retrieved successfully', { user });
});

module.exports = {
  register,
  login,
  getMe
};
