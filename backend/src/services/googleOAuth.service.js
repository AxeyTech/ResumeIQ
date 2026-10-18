import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/apiError.js';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * Google OAuth 2.0 Authorization Code flow, implemented directly against
 * Google's REST endpoints (no SDK dependency, so the exact request/response
 * shape is transparent and easy to verify).
 *
 * Cloud Console configuration this expects:
 *   Authorized JavaScript origin:  http://localhost:3000
 *   Authorized redirect URI:       http://localhost:3000/auth/google/callback
 */
export const googleOAuthService = {
  isConfigured() {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  },

  /**
   * Builds the URL to redirect the browser to, plus a CSRF `state` value the
   * caller should store (e.g. in a short-lived cookie) and verify on callback.
   */
  buildAuthorizationUrl() {
    if (!this.isConfigured()) {
      throw ApiError.serviceUnavailable(
        'Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID/SECRET).',
      );
    }

    const state = crypto.randomBytes(24).toString('hex');
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state,
    });

    return { url: `${AUTH_ENDPOINT}?${params.toString()}`, state };
  },

  /**
   * Exchanges an authorization `code` for tokens, then fetches the user's
   * Google profile. Throws ApiError on any failure so the callback route can
   * redirect back to the frontend with a clean error message.
   */
  async exchangeCodeForProfile(code) {
    if (!this.isConfigured()) {
      throw ApiError.serviceUnavailable('Google sign-in is not configured on this server.');
    }

    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const body = await safeReadText(tokenRes);
      logger.warn('Google token exchange failed', { status: tokenRes.status, body });
      throw ApiError.unauthorized('Google sign-in failed during token exchange. Please try again.');
    }

    const tokens = await tokenRes.json();

    const profileRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      const body = await safeReadText(profileRes);
      logger.warn('Google userinfo fetch failed', { status: profileRes.status, body });
      throw ApiError.unauthorized('Google sign-in failed while fetching your profile. Please try again.');
    }

    const profile = await profileRes.json();

    if (!profile.email) {
      throw ApiError.unauthorized('Your Google account has no email address to sign in with.');
    }
    if (profile.email_verified === false) {
      throw ApiError.unauthorized('Please verify your email address with Google before signing in.');
    }

    return {
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name || profile.email.split('@')[0],
      picture: profile.picture || null,
    };
  },
};

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return '<unreadable response body>';
  }
}
