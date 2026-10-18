import { applicationKitService } from '../services/applicationKit.service.js';
import { parseOrThrow, generateKitSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const applicationKitController = {
  /**
   * POST /api/v1/application-kit/generate
   * Generates tailored cover letter, recruiter InMail, and subject lines
   */
  generate: asyncHandler(async (req, res) => {
    const data = parseOrThrow(generateKitSchema, req.body);
    const result = await applicationKitService.generateKit({
      ...data,
      userId: req.user.id
    });
    res.status(200).json(result);
  }),
};
