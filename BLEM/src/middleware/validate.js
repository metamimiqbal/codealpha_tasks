const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

/**
 * Validates registration payload
 */
const validateRegister = (req, res, next) => {
  const { username, email, password, name } = req.body;
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.push('Username may only contain letters, numbers, and underscores');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
    errors.push('Display name is required (max 50 characters)');
  }

  if (errors.length > 0) {
    return next(ApiError.unprocessable('Validation failed', errors));
  }

  // Normalize trimmed fields
  req.body.username = username.trim().toLowerCase();
  req.body.email = email.trim().toLowerCase();
  req.body.name = name.trim();
  if (req.body.bio) req.body.bio = String(req.body.bio).trim();

  next();
};

/**
 * Validates login payload
 */
const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  const errors = [];

  if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
    errors.push('Username or email is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Missing credentials', errors));
  }

  req.body.identifier = identifier.trim().toLowerCase();
  next();
};

/**
 * Validates profile update payload
 */
const validateProfileUpdate = (req, res, next) => {
  const { name, bio, avatar } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
      errors.push('Name must be between 1 and 50 characters');
    } else {
      req.body.name = name.trim();
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string' || bio.trim().length > 200) {
      errors.push('Bio cannot exceed 200 characters');
    } else {
      req.body.bio = bio.trim();
    }
  }

  if (avatar !== undefined) {
    if (typeof avatar !== 'string') {
      errors.push('Avatar must be a valid string or URL');
    } else {
      req.body.avatar = avatar.trim();
    }
  }

  if (errors.length > 0) {
    return next(ApiError.unprocessable('Invalid profile data', errors));
  }

  next();
};

/**
 * Validates post creation payload
 */
const validatePostCreate = (req, res, next) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return next(ApiError.badRequest('Post content cannot be empty'));
  }

  if (content.trim().length > 500) {
    return next(ApiError.badRequest('Post content cannot exceed 500 characters'));
  }

  req.body.content = content.trim();
  next();
};

/**
 * Validates comment creation payload
 */
const validateCommentCreate = (req, res, next) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return next(ApiError.badRequest('Comment content cannot be empty'));
  }

  if (content.trim().length > 300) {
    return next(ApiError.badRequest('Comment cannot exceed 300 characters'));
  }

  req.body.content = content.trim();
  next();
};

/**
 * Validates route parameters that must be valid MongoDB ObjectIds
 * @param {string} paramName - Name of the route parameter to check (default: 'id')
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      return next(ApiError.badRequest(`Invalid identifier format for '${paramName}'`));
    }
    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePostCreate,
  validateCommentCreate,
  validateObjectId
};
