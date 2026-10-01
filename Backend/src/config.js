import { z } from 'zod';

// Blank values in .env (e.g. `S3_BUCKET=`) mean "not set".
const optional = z
  .string()
  .optional()
  .transform((value) => value || undefined);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  MONGO_URL: z.string(),

  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  AUTH_RATE_LIMIT: z.coerce.number().default(10),

  NVIDIA_API_KEY: optional,
  NVIDIA_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_BASE_URL: z.string().default('https://integrate.api.nvidia.com/v1'),

  S3_BUCKET: optional,
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,

  GMAIL_USER: optional,
  GMAIL_APP_PASSWORD: optional,
  MAIL_FROM: optional,

  // Where the "Contact the team" form in the app sends its messages. Leave empty
  // to disable the form.
  CONTACT_EMAIL: optional,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export const isProd = config.NODE_ENV === 'production';
