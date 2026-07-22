import { Router } from 'express';
import { PLAN_LIMITS } from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ok } from '../lib/http.js';
import { getUsage, buildPlanPayload } from '../services/planService.js';

const router = Router();

/**
 * @openapi
 * /plan:
 *   get:
 *     tags: [Plan]
 *     summary: Current plan, limits, and live usage counters
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Plan + usage }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const usage = await getUsage(req.seller, req.tenantId);
    return ok(res, buildPlanPayload(req.seller, usage));
  })
);

/**
 * @openapi
 * /plan/catalog:
 *   get:
 *     tags: [Plan]
 *     summary: Public pricing catalog (all tiers)
 *     responses:
 *       200: { description: All plan tiers with limits }
 */
router.get('/catalog', (_req, res) => {
  const serialize = (n) => (n === Infinity ? null : n);
  const catalog = Object.entries(PLAN_LIMITS).map(([key, v]) => ({
    key,
    label: v.label,
    pricePerMonthNpr: v.pricePerMonthNpr,
    pricePerYearNpr: v.pricePerYearNpr ?? null,
    channels: serialize(v.channels),
    ordersPerMonth: serialize(v.ordersPerMonth),
    customers: serialize(v.customers),
    products: serialize(v.products),
    teamLogins: serialize(v.teamLogins),
    features: Array.from(v.features),
    support: v.support,
  }));
  return ok(res, { catalog });
});

export default router;
