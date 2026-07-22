import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, paginated, parsePagination } from '../lib/http.js';
import { ActivityLog } from '../models/ActivityLog.js';

const router = Router();

/**
 * @openapi
 * /activity:
 *   get:
 *     tags: [Activity]
 *     summary: Audit log of sensitive actions (paginated)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated activity log }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { seller: req.tenantId };
    const [items, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'fullName email')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);
    return paginated(res, items, { page, limit, total });
  })
);

export default router;
