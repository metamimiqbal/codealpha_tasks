const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a signed JWT token
 * @param {Object} payload - Data to embed in the token (e.g. { id, username })
 * @returns {string} Signed JWT token string
 */
const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = {
  signToken,
  verifyToken
};
