import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const bool = (def) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null ? def : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/dokaandm'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be set (>=16 chars)'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be set (>=16 chars)'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(7),
  COOKIE_SECURE: bool(false),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),

  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)'),

  META_APP_ID: z.string().optional().default(''),
  META_APP_SECRET: z.string().optional().default(''),
  META_GRAPH_VERSION: z.string().default('v21.0'),
  META_OAUTH_REDIRECT_URI: z
    .string()
    .default('http://localhost:4000/api/channels/oauth/callback'),
  META_OAUTH_SCOPES: z
    .string()
    .default(
      'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages,business_management'
    ),
  META_WEBHOOK_VERIFY_TOKEN: z.string().default('change-me-webhook-verify-token'),
  META_TEST_MODE: bool(true),
  META_MESSAGE_RATE_LIMIT_PER_HOUR: z.coerce.number().default(200),

  CLIENT_URL: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment configuration:\n' +
      parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  );
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  isDev: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  metaConfigured: Boolean(raw.META_APP_ID && raw.META_APP_SECRET),
  metaScopes: raw.META_OAUTH_SCOPES.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
