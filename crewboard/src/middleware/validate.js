const { validationResult } = require('express-validator');
const { AppError } = require('./errors');
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(400, errors.array()[0].msg));
  next();
}
module.exports = validate;
