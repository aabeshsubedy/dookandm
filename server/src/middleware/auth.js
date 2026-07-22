import { ApiError } from '../lib/ApiError.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { Seller } from '../models/Seller.js';

/**
 * Require a valid access token. Loads the seller and attaches:
 *   req.seller   — the authenticated seller document
 *   req.tenantId — the tenant scope for ALL data queries (owner id)
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing access token');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token', 'TOKEN_INVALID');
    }

    const seller = await Seller.findById(payload.sub);
    if (!seller || !seller.isActive) {
      throw ApiError.unauthorized('Account not found or inactive');
    }

    req.seller = seller;
    req.tenantId = seller.parentSeller || seller._id;
    next();
  } catch (err) {
    next(err);
  }
}
