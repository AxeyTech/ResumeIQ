import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { resumesRouter } from './resumes.routes.js';
import { analysesRouter } from './analyses.routes.js';
import { optimizerRouter } from './optimizer.routes.js';
import { applicationKitRouter } from './applicationKit.routes.js';
import { mockInterviewRouter } from './mockInterview.routes.js';
import { careerCopilotRouter } from './careerCopilot.routes.js';
import { checkDbConnection } from '../config/db.js';
import { geminiClient } from '../services/geminiClient.service.js';
import { googleOAuthService } from '../services/googleOAuth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.get(
  ['/health', '/api/v1/health'],
  asyncHandler(async (_req, res) => {
    const dbOk = await checkDbConnection().catch(() => false);
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      database: dbOk,
      geminiConfigured: geminiClient.isConfigured(),
      googleOAuthConfigured: googleOAuthService.isConfigured(),
      timestamp: new Date().toISOString(),
    });
  }),
);

// Auth lives at /auth (matches the Google Cloud Console redirect URI, which
// is not prefixed with /api/v1).
router.use('/auth', authRouter);

router.use('/api/v1/resumes', resumesRouter);
router.use('/api/v1/analyses', analysesRouter);
router.use('/api/v1/optimizer', optimizerRouter);
router.use('/api/v1/application-kit', applicationKitRouter);
router.use('/api/v1/mock-interview', mockInterviewRouter);
router.use('/api/v1/career-copilot', careerCopilotRouter);


