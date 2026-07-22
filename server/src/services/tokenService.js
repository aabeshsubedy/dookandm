import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { sha256 } from '../lib/crypto.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { logger } from '../config/logger.js';

const REFRESH_TTL_MS = env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

export function signAccessToken(seller) {
  return jwt.sign(
    {
      sub: String(seller._id),
      tenant: String(seller.parentSeller || seller._id),
      role: seller.role,
      plan: seller.plan,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/** Issue a brand new refresh token in a fresh family (used on login/register). */
export async function issueRefreshToken(seller, ctx = {}) {
  const family = randomUUID();
  return createRefreshRecord(seller._id, family, ctx);
}

async function createRefreshRecord(sellerId, family, ctx) {
  const raw = `${nanoid(48)}.${nanoid(24)}`;
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await RefreshToken.create({
    seller: sellerId,
    tokenHash,
    family,
    expiresAt,
    userAgent: ctx.userAgent,
    ip: ctx.ip,
  });
  return { raw, expiresAt };
}

/**
 * Rotate a refresh token. Implements reuse detection:
 * if a token that was already rotated (has replacedBy) or revoked is presented,
 * the entire family is revoked (likely token theft).
 * Returns { seller, raw, expiresAt } or throws.
 */
export async function rotateRefreshToken(rawToken, ctx = {}) {
  if (!rawToken) return { error: 'MISSING' };
  const tokenHash = sha256(rawToken);
  const record = await RefreshToken.findOne({ tokenHash }).populate('seller');

  if (!record) return { error: 'INVALID' };

  const reused = record.revokedAt || record.replacedBy;
  if (reused) {
    // Reuse of a consumed token => revoke the whole family.
    await RefreshToken.updateMany(
      { family: record.family, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    logger.warn({ family: record.family }, 'Refresh token reuse detected — family revoked');
    return { error: 'REUSE' };
  }

  if (record.expiresAt.getTime() < Date.now()) return { error: 'EXPIRED' };
  if (!record.seller || !record.seller.isActive) return { error: 'INVALID' };

  // Create successor in the same family, mark this one replaced.
  const next = await createRefreshRecord(record.seller._id, record.family, ctx);
  record.revokedAt = new Date();
  record.replacedBy = sha256(next.raw);
  await record.save();

  return { seller: record.seller, raw: next.raw, expiresAt: next.expiresAt };
}

/** Revoke a single refresh token (logout). */
export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = sha256(rawToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

export const refreshCookieMaxAgeMs = REFRESH_TTL_MS;
