import { Router } from 'express';
import { careerCopilotController } from '../controllers/careerCopilot.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const careerCopilotRouter = Router();

careerCopilotRouter.use(requireAuth);

careerCopilotRouter.post('/chat', careerCopilotController.chat);
