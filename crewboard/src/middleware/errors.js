class AppError extends Error { constructor(status, message) { super(message); this.status = status; } }
const notFound = (req, res, next) => next(new AppError(404, 'Resource not found'));
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ success: false, error: { message } });
}
module.exports = { AppError, notFound, errorHandler };
