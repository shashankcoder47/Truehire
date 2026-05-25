import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { env } from './config/env.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import routes from './routes/index.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { ensureUploadsDirectory } from './utils/upload.js';

const app = express();

ensureUploadsDirectory();

const allowedOrigins = new Set(env.frontendUrls);
const isDevelopment = env.nodeEnv !== 'production';

const isAllowedDevelopmentOrigin = (origin) => {
  if (!isDevelopment || !origin) return false;

  return /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(:\d+)?$/i.test(
    origin,
  );
};

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests and configured front-end origins.
      const normalizedOrigin = origin?.replace(/\/+$/, '');

      if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin) || isAllowedDevelopmentOrigin(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!env.awsS3Bucket) {
  app.use('/uploads', express.static(path.resolve(env.uploadsDir)));
}

const loginRateLimiter = createRateLimiter({
  windowMs: env.loginRateLimitWindowMs,
  maxRequests: env.loginRateLimitMax,
  enabled: env.rateLimitEnabled,
});

app.use('/api/auth/login', loginRateLimiter);
app.use('/api/users', userRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
