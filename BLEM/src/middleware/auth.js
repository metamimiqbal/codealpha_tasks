const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/apiError');
const User = require('../models/User');

/**
 * Protect routes - requires a valid JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication required. Please log in.'));
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid authorization token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authorization token has expired. Please log in again.'));
    }
    next(err);
  }
};

/**
 * Optional authentication - attaches user if token is present and valid, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch {
    // If token is invalid or expired, continue as guest
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
