import { ApiError } from '../lib/ApiError.js';
import { env } from '../config/env.js';

/** 404 for unmatched routes. */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler. Never leaks stack traces / internals in production.
 * Maps common Mongoose/JWT errors to clean client responses.
 */
export function errorHandler(err, req, res, _next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      error = ApiError.badRequest('Validation failed', details);
    } else if (error?.name === 'CastError') {
      error = ApiError.badRequest('Invalid identifier');
    } else if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || { value: 1 })[0];
      error = ApiError.conflict(`A record with that ${field} already exists`, 'DUPLICATE');
    } else if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Invalid or expired token', 'TOKEN_INVALID');
    } else {
      error = ApiError.internal();
    }
  }

  const status = error.statusCode || 500;

  // Log server errors with the request id; client errors stay at warn/info.
  if (status >= 500) {
    req.log?.error({ err, code: error.code }, error.message);
  } else {
    req.log?.warn({ code: error.code }, error.message);
  }

  const body = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  };

  // Expose stack only in non-production for debugging.
  if (!env.isProd && status >= 500 && err?.stack) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
}
