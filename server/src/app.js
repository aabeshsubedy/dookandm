import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import swaggerSpec from './config/swagger.js';
import { requestContext } from './middleware/requestContext.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import routes from './routes/index.js';
import { ApiError } from './lib/ApiError.js';

export function createApp() {
  const app = express();

  // Behind a proxy (Render/Railway/Fly) so req.ip / secure cookies work.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());
  app.use(requestContext);

  // Explicit CORS allowlist — no wildcards. Credentialed (refresh cookie).
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server (no Origin header) e.g. webhooks.
        if (!origin) return cb(null, true);
        if (env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new ApiError(403, 'CORS_DENIED', `Origin not allowed: ${origin}`));
      },
      credentials: true,
    })
  );

  // Capture the raw body so the webhook route can verify X-Hub-Signature-256.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // API docs.
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'DokaanDM API' }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  // General API rate limit (auth + webhook have their own tighter limits).
  app.use('/api', apiLimiter, routes);

  app.get('/', (_req, res) => res.json({ name: 'DokaanDM API', docs: '/api/docs' }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
