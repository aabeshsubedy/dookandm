import bcrypt from 'bcryptjs';
import { Seller } from '../models/Seller.js';
import { ApiError } from '../lib/ApiError.js';

const BCRYPT_COST = 12;

export async function registerSeller({ fullName, businessName, email, phone, password }) {
  const existing = await Seller.findOne({ email }).lean();
  if (existing) throw ApiError.conflict('An account with that email already exists', 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const seller = await Seller.create({
    fullName,
    businessName,
    email,
    phone: phone || undefined,
    passwordHash,
    plan: 'free',
    planStatus: 'active',
    role: 'owner',
  });
  return seller;
}

export async function authenticate({ email, password }) {
  // Must explicitly select the hidden hash.
  const seller = await Seller.findOne({ email }).select('+passwordHash');
  // Always run bcrypt to avoid user-enumeration timing differences.
  const hash = seller?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinva';
  const okPassword = await bcrypt.compare(password, hash);
  if (!seller || !okPassword || !seller.isActive) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  seller.lastLoginAt = new Date();
  await seller.save();
  return seller;
}

/** Re-check the signed-in seller's password before sensitive account changes. */
export async function verifySellerPassword(sellerId, password) {
  if (!password || typeof password !== 'string') {
    throw ApiError.badRequest('Password is required');
  }
  const seller = await Seller.findById(sellerId).select('+passwordHash');
  const hash = seller?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinva';
  const okPassword = await bcrypt.compare(password, hash);
  if (!seller || !okPassword || !seller.isActive) {
    throw ApiError.unauthorized('Incorrect password', 'INVALID_PASSWORD');
  }
  return true;
}
