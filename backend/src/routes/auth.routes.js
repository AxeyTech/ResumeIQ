import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { uploadAvatar } from '../middleware/upload.js';

export const authRouter = Router();

// FR-6.1
authRouter.post('/register', authRateLimiter, authController.register);
authRouter.post('/login', authRateLimiter, authController.login);
authRouter.post('/verify-email', authRateLimiter, authController.verifyEmail);
authRouter.post('/resend-verification', authRateLimiter, authController.resendVerification);

// Google OAuth 2.0 — Authorization Code flow.
// Authorized JavaScript origin:  http://localhost:3000
// Authorized redirect URI:       http://localhost:3000/auth/google/callback
authRouter.get('/google', authRateLimiter, authController.googleStart);
authRouter.get('/google/callback', authController.googleCallback);

authRouter.get('/check-username', authController.checkUsername);

authRouter.get('/me', requireAuth, authController.me);
authRouter.patch('/profile', requireAuth, authController.updateProfile);
authRouter.post('/avatar', requireAuth, uploadAvatar, authController.uploadAvatar);
authRouter.delete('/avatar', requireAuth, authController.deleteAvatar);

// FR-6.3
authRouter.delete('/account', requireAuth, authController.deleteAccount);
