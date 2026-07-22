import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function start() {
  await connectDb();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 DokaanDM API listening on http://localhost:${env.PORT}`);
    logger.info(`📚 API docs at http://localhost:${env.PORT}/api/docs`);
    if (!env.metaConfigured) {
      logger.warn('Meta not configured — running in local/dev mode (no live FB/IG).');
    }
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
