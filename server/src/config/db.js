import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);
// NOTE: We deliberately do NOT enable the global `sanitizeFilter` flag.
// It coerces legitimate operator objects ($in/$lt/$ne/$regex) into $eq in a way
// that depends on model load order, silently breaking valid queries. Instead we
// prevent operator-injection at the source: every request body/query is parsed by
// Zod (validate middleware) into primitives before it reaches a query, direct
// query-param filters are coerced with String(), and user regex input goes through
// escapeRegex(). See lib/sanitize.js and the route validators.

export async function connectDb(uri = env.MONGO_URI) {
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  logger.info('MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
