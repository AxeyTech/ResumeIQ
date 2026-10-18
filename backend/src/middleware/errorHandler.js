import multer from 'multer';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

/**
 * NFR-S2: every failure path returns a clear, descriptive error message
 * rather than a raw stack trace, while the full detail is always logged
 * server-side for debugging.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);

  const logPayload = {
    statusCode: normalized.statusCode,
    code: normalized.code,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  };

  if (normalized.statusCode >= 500) {
    logger.error(normalized.message, { ...logPayload, stack: err.stack });
  } else {
    logger.warn(normalized.message, logPayload);
  }

  res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
  });
}

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // A plain object thrown by parseOrThrow() before ApiError wiring, or from
  // a library — treat statusCode/code fields as authoritative if present.
  if (err && typeof err.statusCode === 'number') {
    return new ApiError(err.statusCode, err.message, { code: err.code, details: err.details });
  }

  if (err instanceof multer.MulterError) {
    return mapMulterError(err);
  }

  // Unrecognized/unexpected error — never leak internals to the client.
  return ApiError.internal(isProd ? 'Something went wrong on our end. Please try again.' : err.message);
}

function mapMulterError(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ApiError.badRequest('File is too large. Maximum upload size is 5 MB.', {
      code: 'FILE_TOO_LARGE',
    });
  }
  return ApiError.badRequest(`Upload error: ${err.message}`, { code: 'UPLOAD_ERROR' });
}
