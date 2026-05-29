import { isPostgresDatabase, pool, prisma } from '../config/database.js';

const buckets = new Map();
const initializedDatabaseScopes = new Set();

const getClientKey = (req) =>
  req.ip ||
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

const cleanupExpiredBuckets = (now, windowMs) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now - windowMs) {
      buckets.delete(key);
    }
  }
};

const ensureDatabaseStore = async (scope) => {
  if (initializedDatabaseScopes.has(scope)) return true;

  if (isPostgresDatabase) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        scope varchar(64) NOT NULL,
        client_key varchar(191) NOT NULL,
        request_count integer NOT NULL DEFAULT 0,
        reset_at timestamp NOT NULL,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (scope, client_key)
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_reset_at
      ON rate_limit_buckets (reset_at)
    `);
  } else {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        scope varchar(64) NOT NULL,
        client_key varchar(191) NOT NULL,
        request_count int NOT NULL DEFAULT 0,
        reset_at datetime NOT NULL,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (scope, client_key),
        INDEX idx_rate_limit_reset_at (reset_at)
      )
    `);
  }

  initializedDatabaseScopes.add(scope);
  return true;
};

const incrementDatabaseBucket = async ({ scope, key, windowMs }) => {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  if (isPostgresDatabase) {
    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO rate_limit_buckets (scope, client_key, request_count, reset_at)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (scope, client_key) DO UPDATE SET
         request_count = CASE
           WHEN rate_limit_buckets.reset_at <= NOW() THEN 1
           ELSE rate_limit_buckets.request_count + 1
         END,
         reset_at = CASE
           WHEN rate_limit_buckets.reset_at <= NOW() THEN EXCLUDED.reset_at
           ELSE rate_limit_buckets.reset_at
         END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING request_count, reset_at`,
      scope,
      key,
      resetAt,
    );

    return rows[0] || { request_count: 1, reset_at: resetAt };
  }

  await pool.execute(
    `INSERT INTO rate_limit_buckets (scope, client_key, request_count, reset_at)
     VALUES (?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE
       request_count = IF(reset_at <= NOW(), 1, request_count + 1),
       reset_at = IF(reset_at <= NOW(), VALUES(reset_at), reset_at)`,
    [scope, key, resetAt],
  );

  const [rows] = await pool.execute(
    `SELECT request_count, reset_at
     FROM rate_limit_buckets
     WHERE scope = ? AND client_key = ?
     LIMIT 1`,
    [scope, key],
  );

  return rows[0] || { request_count: 1, reset_at: resetAt };
};

const incrementMemoryBucket = ({ key, now, windowMs }) => {
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket;
};

export const createRateLimiter = ({
  windowMs = 60_000,
  maxRequests = 120,
  keyGenerator = getClientKey,
  enabled = true,
  store = 'memory',
  scope = 'default',
} = {}) => {
  if (!enabled) {
    return (_req, _res, next) => next();
  }

  let lastCleanup = 0;

  return async (req, res, next) => {
    const now = Date.now();

    if (now - lastCleanup > windowMs) {
      cleanupExpiredBuckets(now, windowMs);
      lastCleanup = now;
    }

    const key = keyGenerator(req);
    let count;
    let resetAt;

    if (store === 'database') {
      try {
        const databaseStoreReady = await ensureDatabaseStore(scope);
        if (databaseStoreReady) {
          const bucket = await incrementDatabaseBucket({ scope, key, windowMs });
          count = Number(bucket.request_count || 0);
          resetAt = new Date(bucket.reset_at).getTime();
        }
      } catch (error) {
        console.error('[rate-limit] Database store failed, using memory store for this request:', error.message);
      }
    }

    if (!count || !resetAt) {
      const memoryBucket = incrementMemoryBucket({ key: `${scope}:${key}`, now, windowMs });
      count = memoryBucket.count;
      resetAt = memoryBucket.resetAt;
    }

    const remaining = Math.max(maxRequests - count, 0);
    const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);

    res.setHeader('RateLimit-Limit', String(maxRequests));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }

    next();
  };
};
