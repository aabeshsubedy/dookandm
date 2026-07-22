import { Router } from 'express';
import { registerSchema, loginSchema } from '@dokaandm/shared';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { registerSeller, authenticate } from '../services/authService.js';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/tokenService.js';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } from '../lib/cookies.js';
import { getUsage, buildPlanPayload } from '../services/planService.js';

const router = Router();

const reqCtx = (req) => ({ userAgent: req.headers['user-agent'], ip: req.ip });

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new seller (starts on the Free plan)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, businessName, email, password]
 *             properties:
 *               fullName: { type: string }
 *               businessName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Registered; returns access token + sets refresh cookie }
 *       409: { description: Email already in use }
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const seller = await registerSeller(req.body);
    const accessToken = signAccessToken(seller);
    const { raw } = await issueRefreshToken(seller, reqCtx(req));
    setRefreshCookie(res, raw);
    return ok(res, { seller: seller.toSafeJSON(), accessToken }, 201);
  })
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Authenticated; returns access token + sets refresh cookie }
 *       401: { description: Invalid credentials }
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const seller = await authenticate(req.body);
    const accessToken = signAccessToken(seller);
    const { raw } = await issueRefreshToken(seller, reqCtx(req));
    setRefreshCookie(res, raw);
    return ok(res, { seller: seller.toSafeJSON(), accessToken });
  })
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token and get a new access token
 *     responses:
 *       200: { description: New access token + rotated refresh cookie }
 *       401: { description: Missing/invalid/expired refresh token }
 */
router.post(
  '/refresh',
  authLimiter,
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const result = await rotateRefreshToken(raw, reqCtx(req));
    if (result.error) {
      clearRefreshCookie(res);
      throw ApiError.unauthorized('Session expired, please log in again', 'REFRESH_INVALID');
    }
    setRefreshCookie(res, result.raw);
    const accessToken = signAccessToken(result.seller);
    return ok(res, { accessToken });
  })
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (revokes the refresh token)
 *     responses:
 *       204: { description: Logged out }
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    await revokeRefreshToken(raw);
    clearRefreshCookie(res);
    return res.status(204).end();
  })
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current seller profile + plan + live usage
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Seller profile }
 *       401: { description: Unauthorized }
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const usage = await getUsage(req.seller, req.tenantId);
    return ok(res, {
      seller: req.seller.toSafeJSON(),
      plan: buildPlanPayload(req.seller, usage),
    });
  })
);

export default router;
