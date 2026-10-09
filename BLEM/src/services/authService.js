const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/jwt');

/**
 * Register a new user
 * @param {Object} userData - User registration payload
 * @returns {Promise<{ user: Object, token: string }>}
 */
const register = async ({ username, email, password, name, bio = '', avatar = '' }) => {
  // Check if username or email already taken
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw ApiError.conflict('An account with this email address already exists.');
    }
    throw ApiError.conflict('This username is already taken. Please choose another.');
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    name,
    bio,
    avatar
  });

  const token = signToken({ id: user._id, username: user.username });

  return {
    user: user.toJSON(),
    token
  };
};

/**
 * Log in an existing user
 * @param {string} identifier - Username or Email
 * @param {string} password - Plaintext password
 * @returns {Promise<{ user: Object, token: string }>}
 */
const login = async (identifier, password) => {
  const normalized = identifier.toLowerCase().trim();

  // Explicitly select password field since it is omitted by default in the schema
  const user = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }]
  }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid username/email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid username/email or password.');
  }

  const token = signToken({ id: user._id, username: user.username });

  return {
    user: user.toJSON(),
    token
  };
};

/**
 * Fetch current authenticated user's detailed profile
 * @param {string} userId - User ObjectId
 * @returns {Promise<Object>}
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const userObj = user.toJSON();
  userObj.followersCount = user.followers ? user.followers.length : 0;
  userObj.followingCount = user.following ? user.following.length : 0;

  return userObj;
};

module.exports = {
  register,
  login,
  getCurrentUser
};
