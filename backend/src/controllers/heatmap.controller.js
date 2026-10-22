import { heatmapSaliencyService } from '../services/heatmapSaliency.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const heatmapController = {
  /**
   * GET /api/v1/resumes/:id/heatmap
   * Simulates recruiter 6-second eye-tracking scan, F-pattern trajectory, and blind spot diagnostics.
   */
  getHeatmap: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      throw ApiError.badRequest('Resume ID is required.');
    }

    const data = await heatmapSaliencyService.generateHeatmap(id, userId);
    res.status(200).json(data);
  }),
};
