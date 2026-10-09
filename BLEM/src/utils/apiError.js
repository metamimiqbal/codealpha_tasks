/**
 * Custom application error class for standardized HTTP error handling.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {Array|Object|null} details - Optional validation or error details
   * @param {boolean} isOperational - True if operational error, false if programmer error
   */
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', details = null) {
    return new ApiError(400, msg, details);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden: Access denied') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Resource conflict') {
    return new ApiError(409, msg);
  }

  static unprocessable(msg = 'Validation error', details = null) {
    return new ApiError(422, msg, details);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg, null, false);
  }
}

module.exports = ApiError;
