const ApiError = require('../utils/apiError');

/**
 * 404 handler for unknown routes
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Resource route '${req.method} ${req.originalUrl}' was not found`));
};

module.exports = notFound;
