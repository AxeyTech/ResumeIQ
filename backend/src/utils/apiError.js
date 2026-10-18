/**
 * A structured, operational error safe to expose (partially) to API clients.
 * Anything thrown that is NOT an instance of ApiError is treated as an
 * unexpected bug by the error handler and returns a generic 500.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {{ code?: string, details?: any }} [options]
   */
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code || defaultCodeFor(statusCode);
    this.details = options.details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, options) {
    return new ApiError(400, message, options);
  }
  static unauthorized(message = 'Authentication required', options) {
    return new ApiError(401, message, options);
  }
  static forbidden(message = 'You do not have access to this resource', options) {
    return new ApiError(403, message, options);
  }
  static notFound(message = 'Resource not found', options) {
    return new ApiError(404, message, options);
  }
  static conflict(message, options) {
    return new ApiError(409, message, options);
  }
  static unprocessable(message, options) {
    return new ApiError(422, message, options);
  }
  static tooManyRequests(message = 'Too many requests, please try again shortly', options) {
    return new ApiError(429, message, options);
  }
  static internal(message = 'Something went wrong', options) {
    return new ApiError(500, message, options);
  }
  static serviceUnavailable(message = 'Service temporarily unavailable', options) {
    return new ApiError(503, message, options);
  }
}

function defaultCodeFor(statusCode) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[statusCode] || 'ERROR';
}
