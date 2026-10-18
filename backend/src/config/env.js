import 'dotenv/config';
import { z } from 'zod';

// Fail fast and loudly if required configuration is missing, rather than
// surfacing confusing errors deep inside a request handler later.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PGSSL: z.coerce.boolean().default(false),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be a long random string'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().optional().default('http://localhost:3000/auth/google/callback'),

  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),

  MAX_UPLOAD_MB: z.coerce.number().default(5),
  UPLOAD_DIR: z.string().default('uploads'),

  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY is required (base64, 32 bytes)'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  ANALYZE_CONCURRENCY: z.coerce.number().default(8),
  ANALYZE_QUEUE_LIMIT: z.coerce.number().default(200),

  BACKUP_DIR: z.string().default('backups'),
  BACKUP_CRON: z.string().default('0 3 * * *'),
  PG_DUMP_PATH: z.string().default('pg_dump'),

  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('\n❌ Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  // eslint-disable-next-line no-console
  console.error('\nCopy .env.example to .env and fill in the required values.\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
