import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const isProduction = process.env.NODE_ENV === 'production';

const requireProductionValue = (name, value) => {
  if (isProduction && !value) {
    throw new Error(`Missing required production environment variable: ${name}`);
  }

  return value;
};

const requireStrongProductionSecret = (name, value) => {
  if (!isProduction) {
    return value;
  }

  if (!value || value.length < 32 || ['change_me', 'changeme', 'secret', 'jwt_secret'].includes(value.toLowerCase())) {
    throw new Error(`${name} must be a strong production secret of at least 32 characters`);
  }

  return value;
};

const buildDatabaseUrl = () => {
  const host = process.env.DB_HOST ?? (isProduction ? '' : '127.0.0.1');
  const provider = process.env.DB_PROVIDER ?? 'postgresql';
  const port = process.env.DB_PORT ?? (provider === 'postgresql' ? '5432' : '3306');
  const user = process.env.DB_USER ?? (provider === 'postgresql' ? 'postgres' : 'root');
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME ?? 'truehire';

  let databaseUrl;

  if (isProduction && !process.env.DATABASE_URL && !process.env.DB_HOST) {
    throw new Error('DATABASE_URL or DB_HOST is required in production');
  }

  if (process.env.DATABASE_URL) {
    databaseUrl = process.env.DATABASE_URL;
  } else {
    databaseUrl = `${provider}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const connectionLimit = process.env.PRISMA_CONNECTION_LIMIT ?? process.env.DB_CONNECTION_LIMIT;
    const poolTimeout = process.env.PRISMA_POOL_TIMEOUT ?? process.env.DB_POOL_TIMEOUT;

    if (connectionLimit && !parsedUrl.searchParams.has('connection_limit')) {
      parsedUrl.searchParams.set('connection_limit', connectionLimit);
    }

    if (poolTimeout && !parsedUrl.searchParams.has('pool_timeout')) {
      parsedUrl.searchParams.set('pool_timeout', poolTimeout);
    }

    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
};

const buildFrontendUrls = () => {
  const rawValue = requireProductionValue(
    'FRONTEND_URL',
    process.env.FRONTEND_URL ?? '',
  );

  return rawValue
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const frontendUrls = buildFrontendUrls();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  host: process.env.HOST ?? '0.0.0.0',
  clusterEnabled: String(process.env.CLUSTER_ENABLED ?? 'false').toLowerCase() === 'true',
  workerCount: Math.max(Number(process.env.WEB_CONCURRENCY ?? process.env.WORKER_COUNT ?? 0), 0),
  cronJobsEnabled: String(process.env.CRON_JOBS_ENABLED ?? 'true').toLowerCase() !== 'false',
  serverBacklog: Number(process.env.SERVER_BACKLOG ?? 1024),
  serverMaxConnections: Number(process.env.SERVER_MAX_CONNECTIONS ?? 0),
  keepAliveTimeout: Number(process.env.KEEP_ALIVE_TIMEOUT_MS ?? 65_000),
  headersTimeout: Number(process.env.HEADERS_TIMEOUT_MS ?? 66_000),
  requestTimeout: Number(process.env.REQUEST_TIMEOUT_MS ?? 120_000),
  trustProxy: Number(process.env.TRUST_PROXY_HOPS ?? (isProduction ? 1 : 0)),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? '1mb',
  formBodyLimit: process.env.FORM_BODY_LIMIT ?? '1mb',
  rateLimitEnabled: String(process.env.RATE_LIMIT_ENABLED ?? 'true').toLowerCase() !== 'false',
  rateLimitStore: process.env.RATE_LIMIT_STORE ?? (isProduction ? 'database' : 'memory'),
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 60_000),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? (isProduction ? 10 : 600)),
  jwtSecret: requireStrongProductionSecret('JWT_SECRET', process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  jwtIssuer: process.env.JWT_ISSUER ?? 'truehire-api',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'truehire-web',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  databaseUrl: buildDatabaseUrl(),
  frontendUrl: frontendUrls[0] ?? '',
  frontendUrls,
  uploadsDir: path.resolve(__dirname, '../../uploads'),
  awsRegion: process.env.AWS_REGION ?? 'ap-south-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? '',
  awsS3PublicUrl: process.env.AWS_S3_PUBLIC_URL ?? '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  razorpayCurrency: process.env.RAZORPAY_CURRENCY ?? 'INR',
  razorpayPremiumAmount: Number(process.env.RAZORPAY_PREMIUM_AMOUNT ?? 999),
  razorpayPremiumDurationDays: Number(process.env.RAZORPAY_PREMIUM_DURATION_DAYS ?? 30),
};
