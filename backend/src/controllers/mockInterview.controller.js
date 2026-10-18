import { mockInterviewService } from '../services/mockInterview.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseOrThrow, generateMockQuestionsSchema, evaluateMockAnswerSchema } from '../utils/validators.js';

export const mockInterviewController = {
  /**
   * POST /api/v1/mock-interview/questions
   * Generates tailored interview questions for a resume and role.
   */
  generateQuestions: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = parseOrThrow(generateMockQuestionsSchema, req.body);

    const result = await mockInterviewService.generateQuestions({
      ...data,
      userId,
    });

    res.status(200).json(result);
  }),

  /**
   * POST /api/v1/mock-interview/evaluate
   * Evaluates a candidate's answer with STAR scoring, metrics, and model answer.
   */
  evaluateAnswer: asyncHandler(async (req, res) => {
    const data = parseOrThrow(evaluateMockAnswerSchema, req.body);

    const result = await mockInterviewService.evaluateAnswer(data);

    res.status(200).json(result);
  }),
};
