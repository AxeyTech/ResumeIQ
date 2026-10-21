import { Router } from 'express';
import { resumesController } from '../controllers/resumes.controller.js';
import { analysesController } from '../controllers/analyses.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadResume, verifyUploadedFile } from '../middleware/upload.js';
import { withAnalysisQueue } from '../middleware/rateLimiter.js';

export const resumesRouter = Router();

resumesRouter.use(requireAuth);

// SF-1 — FR-1.1/1.2/1.3/1.4/1.5/1.6
resumesRouter.post('/', uploadResume, verifyUploadedFile, resumesController.upload);

// FR-6.2
resumesRouter.get('/', resumesController.list);
resumesRouter.get('/:id', resumesController.getOne);
resumesRouter.patch('/:id', resumesController.rename);
resumesRouter.delete('/:id', resumesController.remove);

// SF-5 — FR-5.2/5.3
resumesRouter.get('/:id/versions', resumesController.versions);
resumesRouter.get('/:id/versions/compare', analysesController.compareVersions);
resumesRouter.get('/:id/latest-analysis', analysesController.getLatestForResume);
resumesRouter.get('/:id/xray', resumesController.getXRay);

// SF-2 — FR-2.1
resumesRouter.post('/:id/job-description', resumesController.attachJobDescription);
resumesRouter.get('/:id/job-description', resumesController.getJobDescription);

// SF-2 + SF-3 — the heaviest endpoint, so it goes through the concurrency queue (NFR-S3).
resumesRouter.post('/:id/analyze', withAnalysisQueue, analysesController.analyze);

// Step 3 — 1-Click ATS-Perfect Resume Builder & Vector Clean PDF Export
resumesRouter.post('/:id/export-clean-pdf', resumesController.exportCleanPdf);
resumesRouter.post('/:id/builder-save-version', resumesController.saveBuilderVersion);

