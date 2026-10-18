import { Router } from 'express';
import { optimizerController } from '../controllers/optimizer.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const optimizerRouter = Router();

optimizerRouter.use(requireAuth);

optimizerRouter.post('/bullet', optimizerController.optimizeBullet);
