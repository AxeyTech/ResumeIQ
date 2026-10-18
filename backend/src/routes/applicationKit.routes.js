import { Router } from 'express';
import { applicationKitController } from '../controllers/applicationKit.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const applicationKitRouter = Router();

applicationKitRouter.use(requireAuth);

// POST /api/v1/application-kit/generate
applicationKitRouter.post('/generate', applicationKitController.generate);
