import { interviewDefenseService } from '../services/interviewDefense.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const interviewDefenseController = {
  /**
   * GET /api/v1/resumes/:id/defense
   * Retrieves or computes the Reverse Interview Defense & Google XYZ analysis.
   */
  getDefense: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      throw ApiError.badRequest('Resume ID is required.');
    }

    const result = await interviewDefenseService.getOrAnalyze(id, userId, false);
    res.status(200).json(result);
  }),

  /**
   * POST /api/v1/resumes/:id/defense/refresh
   * Forces re-analysis of the resume bullets and defenses.
   */
  refreshDefense: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      throw ApiError.badRequest('Resume ID is required.');
    }

    const result = await interviewDefenseService.getOrAnalyze(id, userId, true);
    res.status(200).json(result);
  }),
};
