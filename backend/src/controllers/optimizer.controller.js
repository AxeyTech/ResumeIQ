import { bulletOptimizerService } from '../services/bulletOptimizer.service.js';
import { parseOrThrow, optimizeBulletSchema, injectKeywordsSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const optimizerController = {
  /**
   * POST /api/v1/optimizer/bullet
   * Rewrites an existing resume bullet point into 3 STAR-format variants.
   */
  optimizeBullet: asyncHandler(async (req, res) => {
    const data = parseOrThrow(optimizeBulletSchema, req.body);
    const result = await bulletOptimizerService.optimize(data);
    res.status(200).json(result);
  }),

  /**
   * POST /api/v1/optimizer/inject-keywords
   * Generates tailored resume bullets naturally embedding missing target keywords.
   */
  injectKeywords: asyncHandler(async (req, res) => {
    const data = parseOrThrow(injectKeywordsSchema, req.body);
    const result = await bulletOptimizerService.injectKeywords(data);
    res.status(200).json(result);
  }),
};
