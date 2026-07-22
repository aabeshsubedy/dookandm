import { Router } from 'express';
import mongoose from 'mongoose';
import { FEATURES } from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { requireFeature } from '../middleware/plan.js';
import { asyncHandler, ok } from '../lib/http.js';
import { Order } from '../models/Order.js';
import { Reminder } from '../models/Reminder.js';

const router = Router();

router.use(requireAuth, requireFeature(FEATURES.DASHBOARD));

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Home cards — today's orders, COD pending, follow-ups due, month revenue
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Summary cards }
 */
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const seller = req.tenantId;
    const today = startOfToday();
    const monthStart = startOfMonth();
    const now = new Date();

    const [todayAgg, codPending, followUpsDue, monthRevenueAgg, pipelineAgg] = await Promise.all([
      Order.aggregate([
        { $match: { seller: toId(seller), createdAt: { $gte: today } } },
        { $group: { _id: null, count: { $sum: 1 }, valuePaisa: { $sum: '$totalPaisa' } } },
      ]),
      Order.countDocuments({ seller, paymentType: 'cod', status: 'pending' }),
      Reminder.countDocuments({ seller, status: 'open', dueAt: { $lte: now } }),
      Order.aggregate([
        { $match: { seller: toId(seller), status: 'delivered', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, valuePaisa: { $sum: '$totalPaisa' } } },
      ]),
      Order.aggregate([
        { $match: { seller: toId(seller) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const pipeline = {};
    for (const row of pipelineAgg) pipeline[row._id] = row.count;

    return ok(res, {
      todayOrders: {
        count: todayAgg[0]?.count || 0,
        valuePaisa: todayAgg[0]?.valuePaisa || 0,
      },
      codPending,
      followUpsDue,
      monthRevenuePaisa: monthRevenueAgg[0]?.valuePaisa || 0,
      pipeline,
    });
  })
);

/**
 * @openapi
 * /dashboard/revenue:
 *   get:
 *     tags: [Dashboard]
 *     summary: 30-day daily revenue series (delivered orders)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Revenue series }
 */
router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const seller = req.tenantId;
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const rows = await Order.aggregate([
      { $match: { seller: toId(seller), status: 'delivered', updatedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          valuePaisa: { $sum: '$totalPaisa' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps so the chart has one point per day.
    const byDay = new Map(rows.map((r) => [r._id, r]));
    const series = [];
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const row = byDay.get(key);
      series.push({ date: key, valuePaisa: row?.valuePaisa || 0, count: row?.count || 0 });
    }
    return ok(res, { series });
  })
);

function toId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

export default router;
