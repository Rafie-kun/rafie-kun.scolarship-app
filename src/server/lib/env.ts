import { z } from 'zod';

// Build-safe env schema: optional integrations default to empty strings.
// Strict checks happen where a feature actually needs the value.
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default(''),
  DATABASE_URL_UNPOOLED: z.string().default(''),

  // Auth
  AUTH_SECRET: z.string().default('dev-only-insecure-secret-change-me-please'),
  AUTH_URL: z.string().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),

  // Email
  EMAIL_SERVER: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default(''),

  // Storage
  STORAGE_BUCKET: z.string().default(''),
  STORAGE_ENDPOINT: z.string().default(''),
  STORAGE_REGION: z.string().default(''),
  STORAGE_ACCESS_KEY_ID: z.string().default(''),
  STORAGE_SECRET_ACCESS_KEY: z.string().default(''),

  // AI (server-only)
  GEMINI_API_KEY: z.string().default(''),
  AI_MODEL: z.string().default('gemini-3.6-flash'),

  // FX (server-only)
  FX_PROVIDER: z.string().default(''),
  FX_API_KEY: z.string().default(''),

  // Rate limiting (durable store)
  RATE_LIMIT_REDIS_URL: z.string().default(''),
  RATE_LIMIT_REDIS_TOKEN: z.string().default(''),

  // Jobs / cron
  CRON_SECRET: z.string().default('dev-only-cron-secret-change-me'),

  // Admin bootstrap
  ADMIN_BOOTSTRAP_EMAIL: z.string().default(''),

  // Public (only var allowed with NEXT_PUBLIC_)
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),

  // Optional
  SENTRY_DSN: z.string().default(''),

  // Platform
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  VERCEL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function env(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      // Never crash the build; log clearly and fall back to defaults.
      console.error('[env] Invalid environment:');
      console.error(result.error.format());
      _env = envSchema.parse({});
    } else {
      _env = result.data;
    }
  }
  return _env;
}

export type { Env };
