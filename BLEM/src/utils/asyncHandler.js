/**
 * Wraps asynchronous Express route handlers to catch exceptions and pass them to next().
 * @param {Function} fn - Async express route handler
 * @returns {Function}
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
