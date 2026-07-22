import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const skip = () => env.isTest || env.isDev; // don't throttle during tests or local dev

const handler = (_req, res) =>
  res.status(429).json({
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' },
  });

/** Tight limiter for auth endpoints (login/register/refresh/forgot). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
});

/** Webhook receiver limiter — generous but bounded to blunt abuse/floods. */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
});

/** General API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
});
