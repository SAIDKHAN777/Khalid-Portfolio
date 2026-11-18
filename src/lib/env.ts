import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4321),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(),
    TEST_DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long'),
    ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email'),
    ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters long'),
    SITE_URL: z.string().default('https://saidkhan.dev'),

    // Optional / Third-party services
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional().default('contact@saidkhan.dev'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
    CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Require SSL in production connection strings
    if (data.NODE_ENV === 'production') {
      const hasSsl =
        data.DATABASE_URL.includes('sslmode=require') ||
        data.DATABASE_URL.includes('sslmode=verify-full') ||
        data.DATABASE_URL.includes('sslmode=verify-ca') ||
        data.DATABASE_URL.includes('ssl=true');

      if (!hasSsl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message:
            'DATABASE_URL must enforce SSL in production (e.g. ?sslmode=require or &sslmode=require)',
        });
      }

      if (data.DIRECT_URL) {
        const hasDirectSsl =
          data.DIRECT_URL.includes('sslmode=require') ||
          data.DIRECT_URL.includes('sslmode=verify-full') ||
          data.DIRECT_URL.includes('sslmode=verify-ca') ||
          data.DIRECT_URL.includes('ssl=true');

        if (!hasDirectSsl) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['DIRECT_URL'],
            message:
              'DIRECT_URL must enforce SSL in production (e.g. ?sslmode=require or &sslmode=require)',
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Invalid environment variables configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  // In test environment, don't necessarily exit if we are testing schema failure
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env: Env = parsedEnv.success ? parsedEnv.data : (process.env as unknown as Env);
export { envSchema };
