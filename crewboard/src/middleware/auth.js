const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errors');
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) throw new AppError(401, 'Authentication required');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new AppError(401, 'Authentication required');
    req.user = user;
    next();
  } catch (error) { next(error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError ? new AppError(401, 'Invalid or expired session') : error); }
}
module.exports = { requireAuth };
