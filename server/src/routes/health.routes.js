import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Liveness/readiness probe (DB connectivity)
 *     responses:
 *       200: { description: Healthy }
 *       503: { description: Degraded (DB not ready) }
 */
router.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const healthy = dbState === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db: healthy ? 'connected' : 'disconnected',
    metaConfigured: env.metaConfigured,
    metaTestMode: env.META_TEST_MODE,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
