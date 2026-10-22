import { githubProofOfWorkService } from '../services/githubProofOfWork.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const githubProofOfWorkController = {
  /**
   * GET /api/v1/resumes/:id/proof-of-work
   */
  getProofOfWork: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      throw ApiError.badRequest('Resume ID is required.');
    }

    const data = await githubProofOfWorkService.getProofOfWork(id, userId);
    res.status(200).json(data);
  }),

  /**
   * POST /api/v1/resumes/:id/verify-proof-of-work
   */
  verifyProofOfWork: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { repoUrl } = req.body || {};
    const userId = req.user.id;

    if (!id) {
      throw ApiError.badRequest('Resume ID is required.');
    }

    const data = await githubProofOfWorkService.verifyProofOfWork(id, userId, repoUrl);
    res.status(200).json(data);
  }),
};
