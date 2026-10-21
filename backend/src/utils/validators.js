import { z } from 'zod';
import { ApiError } from './apiError.js';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('A valid email is required').max(255),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const jobDescriptionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(30, 'Job description looks too short to extract meaningful requirements from')
    .max(20_000, 'Job description is too long (max 20,000 characters)'),
});

export const renameResumeSchema = z.object({
  displayName: z.string().trim().min(1, 'Name cannot be empty').max(255),
});

export const analyzeOptionsSchema = z
  .object({
    useBenchmarkIfNoJd: z.boolean().optional().default(true),
  })
  .optional()
  .default({});

export const optimizeBulletSchema = z.object({
  bullet: z
    .string()
    .trim()
    .min(5, 'Bullet point must be at least 5 characters')
    .max(1000, 'Bullet point cannot exceed 1000 characters'),
  targetKeywords: z.array(z.string().trim()).optional().default([]),
  jobTitle: z.string().trim().max(100).optional().default('Software Engineer'),
  tone: z.enum(['impactful', 'technical', 'executive']).optional().default('impactful'),
});

export const injectKeywordsSchema = z.object({
  keywords: z
    .array(z.string().trim().min(1).max(100))
    .min(1, 'Please provide at least 1 keyword')
    .max(10, 'Maximum 10 keywords at a time'),
  jobTitle: z.string().trim().max(100).optional().default('Software Engineer'),
  context: z.string().trim().max(500).optional().default(''),
});

export const generateKitSchema = z.object({
  resumeId: z.string().uuid('Valid resumeId is required'),
  jobDescriptionText: z.string().trim().max(25_000).optional().default(''),
  companyName: z.string().trim().max(100).optional().default('Hiring Team'),
  jobTitle: z.string().trim().max(100).optional().default('Target Role'),
  tone: z.enum(['confident', 'professional', 'executive']).optional().default('confident'),
});

export const resumeBuilderDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().trim().min(1, 'Full name is required').max(100),
    title: z.string().trim().max(100).optional().default(''),
    email: z.string().trim().max(120).optional().default(''),
    phone: z.string().trim().max(50).optional().default(''),
    location: z.string().trim().max(100).optional().default(''),
    linkedin: z.string().trim().max(200).optional().default(''),
    github: z.string().trim().max(200).optional().default(''),
    website: z.string().trim().max(200).optional().default(''),
  }),
  summary: z.string().trim().max(3000).optional().default(''),
  skills: z.any().optional().default([]),
  experience: z.array(z.any()).optional().default([]),
  projects: z.array(z.any()).optional().default([]),
  education: z.array(z.any()).optional().default([]),
  certifications: z.array(z.any()).optional().default([]),
});

export const builderSaveVersionSchema = z.object({
  displayName: z.string().trim().min(1).max(255).optional(),
  resumeData: resumeBuilderDataSchema,
  reAnalyze: z.boolean().optional().default(true),
});

export const generateMockQuestionsSchema = z.object({
  resumeId: z.string().uuid().optional(),
  interviewType: z.enum(['behavioral', 'technical', 'system_design']).optional().default('behavioral'),
  difficulty: z.enum(['entry', 'mid', 'senior', 'lead']).optional().default('senior'),
  jobTitle: z.string().trim().max(100).optional().default('Software Engineer'),
  jobDescriptionText: z.string().trim().max(25_000).optional().default(''),
});

export const evaluateMockAnswerSchema = z.object({
  question: z.string().trim().min(5, 'Question is required').max(1000),
  category: z.string().trim().max(100).optional().default('Behavioral'),
  userAnswer: z.string().trim().min(5, 'Answer must contain at least 5 characters').max(10_000),
  interviewType: z.enum(['behavioral', 'technical', 'system_design']).optional().default('behavioral'),
  difficulty: z.enum(['entry', 'mid', 'senior', 'lead']).optional().default('senior'),
});

export const careerCopilotChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(3000, 'Message cannot exceed 3000 characters'),
  resumeId: z.string().uuid().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .optional()
    .default([]),
  context: z.record(z.any()).optional().default({}),
});



/**
 * Parses `schema` against `data`, throwing an ApiError(400) with a flattened
 * field-level message on failure so controllers can call this once and
 * trust the result.
 * @template T
 * @param {z.ZodType<T>} schema
 * @param {unknown} data
 * @returns {T}
 */
export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    throw ApiError.badRequest(details.map((d) => `${d.field}: ${d.message}`).join('; '), {
      code: 'VALIDATION_ERROR',
      details,
    });
  }
  return result.data;
}
