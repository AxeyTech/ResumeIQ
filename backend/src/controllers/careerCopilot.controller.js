import { careerCopilotService } from '../services/careerCopilot.service.js';
import { careerCopilotChatSchema, parseOrThrow } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const careerCopilotController = {
  chat: asyncHandler(async (req, res) => {
    const data = parseOrThrow(careerCopilotChatSchema, req.body);
    const userId = req.user.id;

    const result = await careerCopilotService.chat({
      userId,
      message: data.message,
      resumeId: data.resumeId,
      conversationHistory: data.conversationHistory,
      context: data.context,
    });

    res.status(200).json(result);
  }),
};
