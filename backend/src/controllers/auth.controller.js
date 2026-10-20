import { authService } from '../services/auth.service.js';
import { googleOAuthService } from '../services/googleOAuth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseOrThrow, registerSchema, loginSchema } from '../utils/validators.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';
import { z } from 'zod';

const GOOGLE_STATE_COOKIE = 'g_oauth_state';

const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().length(6, 'Code must be 6 digits'),
});

const resendSchema = z.object({
  email: z.string().trim().email(),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(255).optional(),
  username: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? undefined : val))
    .refine((val) => !val || (val.length >= 3 && val.length <= 30 && /^[a-zA-Z0-9_]+$/.test(val)), {
      message: 'Username must be 3-30 letters, numbers, or underscores',
    }),
  avatarUrl: z.string().trim().nullable().optional(),
});

export const authController = {
  /** POST /auth/register */
  register: asyncHandler(async (req, res) => {
    const data = parseOrThrow(registerSchema, req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  }),

  /** POST /auth/login */
  login: asyncHandler(async (req, res) => {
    const data = parseOrThrow(loginSchema, req.body);
    const result = await authService.login(data);
    res.status(200).json(result);
  }),

  /** POST /auth/verify-email */
  verifyEmail: asyncHandler(async (req, res) => {
    const data = parseOrThrow(verifyEmailSchema, req.body);
    const result = await authService.verifyEmail(data);
    res.status(200).json(result);
  }),

  /** POST /auth/resend-verification */
  resendVerification: asyncHandler(async (req, res) => {
    const data = parseOrThrow(resendSchema, req.body);
    const result = await authService.resendVerification(data);
    res.status(200).json(result);
  }),

  /** PATCH /auth/profile */
  updateProfile: asyncHandler(async (req, res) => {
    const data = parseOrThrow(updateProfileSchema, req.body);
    const user = await authService.updateProfile(req.user.id, data);
    res.status(200).json({ user });
  }),

  /** POST /auth/avatar */
  uploadAvatar: asyncHandler(async (req, res) => {
    if (!req.file || !req.file.buffer) {
      throw ApiError.badRequest('No image file uploaded.');
    }
    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Data = req.file.buffer.toString('base64');
    const avatarUrl = `data:${mimeType};base64,${base64Data}`;
    const user = await authService.updateProfile(req.user.id, { avatarUrl });
    res.status(200).json({ user });
  }),

  /** DELETE /auth/avatar */
  deleteAvatar: asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, { avatarUrl: null });
    res.status(200).json({ user });
  }),

  /** GET /auth/check-username */
  checkUsername: asyncHandler(async (req, res) => {
    const username = String(req.query.username || '').trim();
    if (!username || username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(200).json({ available: false, reason: 'Must be 3-30 letters, numbers, or underscores' });
    }
    const available = await authService.isUsernameAvailable(username);
    res.status(200).json({ available });
  }),

  /** GET /auth/me */
  me: asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({ user });
  }),

  /** DELETE /auth/account — FR-6.3 */
  deleteAccount: asyncHandler(async (req, res) => {
    await authService.deleteAccount(req.user.id);
    res.status(204).send();
  }),

  /**
   * GET /auth/google
   * Kicks off the server-side OAuth Authorization Code flow. The state
   * value is stored in a short-lived, httpOnly cookie and re-checked on
   * callback to prevent CSRF.
   */
  googleStart: asyncHandler(async (req, res) => {
    const { url, state } = googleOAuthService.buildAuthorizationUrl();
    res.cookie(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(url);
  }),

  /**
   * GET /auth/google/callback
   * Matches the Authorized redirect URI configured in Google Cloud Console:
   *   http://localhost:3000/auth/google/callback
   * On success, redirects to the frontend with a one-time token in the URL
   * fragment (never logged, never sent to any server as a query string).
   */
  googleCallback: asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;
    const expectedState = req.cookies?.[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE);

    if (error) {
      logger.warn('Google OAuth returned an error', { error });
      return res.redirect(`${env.FRONTEND_URL}/?auth_error=${encodeURIComponent(String(error))}`);
    }
    if (!code) {
      throw ApiError.badRequest('Missing authorization code from Google.');
    }
    if (!expectedState || state !== expectedState) {
      throw ApiError.unauthorized('OAuth state mismatch — please try signing in again.');
    }

    const { token } = await authService.loginWithGoogleCode(String(code));
    res.redirect(`${env.FRONTEND_URL}/#token=${encodeURIComponent(token)}`);
  }),
};
