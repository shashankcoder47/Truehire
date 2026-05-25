const buckets = new Map();

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

export const createRateLimiter = ({
  windowMs = 60_000,
  maxRequests = 120,
  keyGenerator = getClientKey,
  enabled = true,
} = {}) => {
  if (!enabled) {
    return (_req, _res, next) => next();
  }

  let lastCleanup = 0;

  return (req, res, next) => {
    const now = Date.now();

    if (now - lastCleanup > windowMs) {
      cleanupExpiredBuckets(now, windowMs);
      lastCleanup = now;
    }

    const key = keyGenerator(req);
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(maxRequests - bucket.count, 0);
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader('RateLimit-Limit', String(maxRequests));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }

    next();
  };
};
