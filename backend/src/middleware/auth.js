import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Requires a valid Bearer token. Attaches `req.user = { id, email, role }`.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header.');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw ApiError.unauthorized('Your session has expired or is invalid. Please sign in again.');
  }
});

/** Attaches req.user if a valid token is present, but never rejects the request. */
export function attachUserIfPresent(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      // ignore invalid/expired token for optional-auth routes
    }
  }
  next();
}

/** Restricts a route to a specific role (e.g. 'admin'). Use after requireAuth. */
export function requireRole(role) {
  return (req, _res, next) => {
    if (req.user?.role !== role) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }
    next();
  };
}
