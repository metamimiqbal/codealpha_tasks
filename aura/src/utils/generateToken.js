const jwt = require('jsonwebtoken');
const config = require('../config/config');

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );
}

module.exports = generateToken;
