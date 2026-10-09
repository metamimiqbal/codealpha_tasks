/**
 * Standardized API response format helper.
 */
class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {import('express').Response} res
   * @param {number} statusCode
   * @param {string} message
   * @param {any} data
   * @param {Object} [meta]
   */
  static success(res, statusCode = 200, message = 'Success', data = null, meta = undefined) {
    const responsePayload = {
      success: true,
      statusCode,
      message,
      data
    };

    if (meta !== undefined) {
      responsePayload.meta = meta;
    }

    return res.status(statusCode).json(responsePayload);
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return ApiResponse.success(res, 201, message, data);
  }
}

module.exports = ApiResponse;
