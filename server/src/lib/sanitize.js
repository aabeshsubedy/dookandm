import mongoose from 'mongoose';

/** Escape user input before interpolating into a RegExp (prevents ReDoS/injection). */
export function escapeRegex(input = '') {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a case-insensitive "contains" regex filter value.
 * Wrapped in `mongoose.trusted()` because global `sanitizeFilter` would
 * otherwise coerce our intentional `$regex` operator into `$eq` (breaking search).
 * The pattern itself is escaped, so this stays injection-safe.
 */
export function containsRegex(value) {
  return mongoose.trusted({ $regex: escapeRegex(value), $options: 'i' });
}
