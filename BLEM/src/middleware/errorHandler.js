const env = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Centralized global error handling middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert standard errors to ApiError if necessary
  if (!(error instanceof ApiError)) {
    // Mongoose CastError (e.g. invalid ObjectId format)
    if (err.name === 'CastError') {
      const message = `Invalid value for parameter '${err.path}': ${err.value}`;
      error = ApiError.badRequest(message);
    }
    // Mongoose ValidationError
    else if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      error = ApiError.unprocessable('Validation Error', messages);
    }
    // MongoDB duplicate key error
    else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      const message = `A record with this ${field} already exists.`;
      error = ApiError.conflict(message);
    }
    // JSON parse error in body
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error = ApiError.badRequest('Malformed JSON in request payload');
    }
    // Fallback: internal server error
    else {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, null, false);
    }
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    statusCode,
    message: error.message,
    ...(error.details && { details: error.details })
  };

  // Include stack trace only in local non-production development if it's an unexpected internal error
  if (env.NODE_ENV === 'development' && !error.isOperational) {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error(`[ERROR 500] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
