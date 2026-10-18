import { Router } from 'express';
import { mockInterviewController } from '../controllers/mockInterview.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const mockInterviewRouter = Router();

mockInterviewRouter.use(requireAuth);

mockInterviewRouter.post('/questions', mockInterviewController.generateQuestions);
mockInterviewRouter.post('/evaluate', mockInterviewController.evaluateAnswer);
