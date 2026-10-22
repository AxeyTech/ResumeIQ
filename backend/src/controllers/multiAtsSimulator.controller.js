import { multiAtsSimulatorService } from '../services/multiAtsSimulator.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const multiAtsSimulatorController = {
  /**
   * GET /api/v1/resumes/:id/multi-ats-simulation
   * Returns deep parsing emulation and scorecards across Workday, Taleo, Greenhouse, and Lever.
   */
  getSimulation: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      throw ApiError.badRequest('Resume ID is required.');
    }

    const data = await multiAtsSimulatorService.simulateMultiAts(id, userId);
    res.status(200).json(data);
  }),
};
