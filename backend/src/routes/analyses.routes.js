import { Router } from 'express';
import { analysesController } from '../controllers/analyses.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const analysesRouter = Router();

analysesRouter.use(requireAuth);

analysesRouter.get('/:id', analysesController.getOne);

// SF-4 — FR-4.1/4.2/4.3/4.4
analysesRouter.get('/:id/report', analysesController.getReport);
analysesRouter.get('/:id/report.pdf', analysesController.downloadReportPdf);
analysesRouter.get('/:id/persona-simulations', analysesController.getPersonaSimulations);
analysesRouter.get('/:id/knockout-radar', analysesController.getKnockoutRadar);
