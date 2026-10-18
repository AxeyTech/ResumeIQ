import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';
import { googleOAuthService } from './googleOAuth.service.js';
import { generateOtp, OTP_EXPIRY_MINUTES, sendVerificationEmail } from './email.service.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatar_url,
    role: user.role,
    hasGoogleLinked: Boolean(user.has_google ?? user.google_id),
    emailVerified: Boolean(user.email_verified),
    createdAt: user.created_at,
  };
}

export const authService = {
  /** FR-6.1: register with email + password. Sends OTP for verification. */
  async register({ email, name, password, username }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    if (username) {
      const taken = await userRepository.isUsernameTaken(username);
      if (taken) {
        throw ApiError.conflict('This username is already taken. Please choose another.');
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.createWithPassword({ email, name, passwordHash, username });

    // Generate and store OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await userRepository.setVerificationCode(user.id, otp, expiresAt);

    // Send verification email (non-blocking — if SMTP is not configured, OTP is logged)
    sendVerificationEmail(email, otp, name).catch((err) => {
      logger.error('Failed to send verification email', { email, error: err.message });
    });

    logger.info('User registered — verification pending', { userId: user.id });

    // Return user info but NO token yet — user must verify first
    return { user: toPublicUser(user), message: 'Verification code sent to your email.' };
  },

  /** Verify email with OTP code */
  async verifyEmail({ email, code }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('No account found with this email.');

    if (user.email_verified) {
      return { user: toPublicUser(user), message: 'Email already verified.' };
    }

    if (!user.verification_code) {
      throw ApiError.badRequest('No verification code pending. Please register again.');
    }

    if (new Date() > new Date(user.verification_expires_at)) {
      throw ApiError.badRequest('Verification code has expired. Please request a new one.');
    }

    if (user.verification_code !== code) {
      throw ApiError.unauthorized('Incorrect verification code.');
    }

    await userRepository.markEmailVerified(user.id);

    const token = signAccessToken(user);
    logger.info('Email verified successfully', { userId: user.id });

    const verifiedUser = await userRepository.findByEmail(email);
    return { user: toPublicUser(verifiedUser), token };
  },

  /** Resend OTP to user's email */
  async resendVerification({ email }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('No account found with this email.');

    if (user.email_verified) {
      return { message: 'Email already verified. You can sign in.' };
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await userRepository.setVerificationCode(user.id, otp, expiresAt);

    sendVerificationEmail(email, otp, user.name).catch((err) => {
      logger.error('Failed to resend verification email', { email, error: err.message });
    });

    logger.info('Verification code resent', { userId: user.id });
    return { message: 'New verification code sent to your email.' };
  },

  /** FR-6.1: authenticate with email + password. Only allows verified users. */
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    const invalidCredentials = () => ApiError.unauthorized('Invalid email or password.');

    if (!user) throw invalidCredentials();
    if (!user.password_hash) {
      throw ApiError.unauthorized(
        'This account was created with Google sign-in. Use "Continue with Google" instead.',
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw invalidCredentials();

    // Block unverified users
    if (!user.email_verified) {
      // Auto-resend OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await userRepository.setVerificationCode(user.id, otp, expiresAt);
      sendVerificationEmail(email, otp, user.name).catch(() => {});

      throw ApiError.forbidden(
        'Please verify your email first. A new verification code has been sent.',
        { code: 'EMAIL_NOT_VERIFIED' },
      );
    }

    const token = signAccessToken(user);
    logger.info('User logged in', { userId: user.id });
    return { user: toPublicUser(user), token };
  },

  /**
   * FR-6.1: sign in (or silently register) via Google. Links to an existing
   * password-based account if the email already exists but has no Google
   * identity attached yet. Google users are auto-verified.
   */
  async loginWithGoogleCode(code) {
    const profile = await googleOAuthService.exchangeCodeForProfile(code);

    let user = await userRepository.findByGoogleId(profile.googleId);

    if (!user) {
      const existingByEmail = await userRepository.findByEmail(profile.email);
      if (existingByEmail) {
        user = await userRepository.linkGoogleId(existingByEmail.id, profile.googleId);
        await userRepository.markEmailVerifiedForGoogle(existingByEmail.id);
        logger.info('Linked Google identity to existing account', { userId: user.id });
      } else {
        user = await userRepository.createWithGoogle({
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
        });
        await userRepository.markEmailVerifiedForGoogle(user.id);
        logger.info('User registered via Google', { userId: user.id });
      }
    }

    const token = signAccessToken(user);
    return { user: toPublicUser(user), token };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');
    return toPublicUser(user);
  },

  /** Updates display name, username handle, and/or avatar DP */
  async updateProfile(userId, { name, username, avatarUrl }) {
    if (username) {
      const taken = await userRepository.isUsernameTaken(username, userId);
      if (taken) {
        throw ApiError.conflict('This username is already taken. Please choose another.');
      }
    }
    const updated = await userRepository.updateProfile(userId, { name, username, avatarUrl });
    if (!updated) throw ApiError.notFound('User not found.');
    logger.info('User profile updated', { userId, username });
    return toPublicUser(updated);
  },

  /** Check if a username is available */
  async isUsernameAvailable(username) {
    const taken = await userRepository.isUsernameTaken(username);
    return !taken;
  },

  /** FR-6.3: permanent account deletion. FK cascades remove all owned
   * resumes, job descriptions, analyses, and reports automatically. */
  async deleteAccount(userId) {
    await userRepository.deleteById(userId);
    logger.info('User account permanently deleted', { userId });
  },
};
