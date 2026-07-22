import { Router } from 'express';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  ORDER_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  FEATURES,
} from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature, enforceOrderQuota } from '../middleware/plan.js';
import { asyncHandler, ok, paginated, parsePagination } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { Order } from '../models/Order.js';
import { containsRegex } from '../lib/sanitize.js';
import { createOrder, changeOrderStatus } from '../services/orderService.js';

const router = Router();

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders (paginated, filterable by status/paymentType/q)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: paymentType, schema: { type: string } }
 *       - { in: query, name: q, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated orders }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { seller: req.tenantId };
    // Coerce query params to primitives (Express parses ?x[$ne]= into objects).
    const status = req.query.status != null ? String(req.query.status) : '';
    const paymentType = req.query.paymentType != null ? String(req.query.paymentType) : '';
    if (status && ORDER_STATUSES.includes(status)) query.status = status;
    if (paymentType && PAYMENT_TYPES.includes(paymentType)) query.paymentType = paymentType;
    if (req.query.q) {
      const rx = containsRegex(req.query.q);
      query.$or = [{ orderNumber: rx }, { phone: rx }, { 'items.productName': rx }];
    }
    const [items, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name phones riskCache tags')
        .lean(),
      Order.countDocuments(query),
    ]);
    return paginated(res, items, { page, limit, total });
  })
);

/**
 * @openapi
 * /orders/board:
 *   get:
 *     tags: [Orders]
 *     summary: Pipeline board — per-stage counts + recent orders (paid kanban)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Board data }
 */
router.get(
  '/board',
  requireAuth,
  requireFeature(FEATURES.KANBAN),
  asyncHandler(async (req, res) => {
    const stages = ORDER_STATUSES.filter((s) => s !== 'cancelled');
    const perStage = await Promise.all(
      stages.map(async (status) => {
        const [orders, total] = await Promise.all([
          Order.find({ seller: req.tenantId, status })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('customer', 'name phones riskCache')
            .lean(),
          Order.countDocuments({ seller: req.tenantId, status }),
        ]);
        return { status, total, orders };
      })
    );
    return ok(res, { board: perStage });
  })
);

/**
 * @openapi
 * /orders/export.csv:
 *   get:
 *     tags: [Orders]
 *     summary: Export orders as CSV (paid)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: CSV file }
 */
router.get(
  '/export.csv',
  requireAuth,
  requireFeature(FEATURES.CSV_EXPORT),
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ seller: req.tenantId })
      .sort({ createdAt: -1 })
      .limit(5000)
      .populate('customer', 'name')
      .lean();
    const rows = [
      ['Order', 'Date', 'Customer', 'Phone', 'Items', 'Total (NPR)', 'Payment', 'Status'],
      ...orders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toISOString().slice(0, 10),
        o.customer?.name || '',
        o.phone,
        o.items.map((i) => `${i.qty}x ${i.productName}`).join('; '),
        (o.totalPaisa / 100).toFixed(2),
        PAYMENT_TYPE_LABELS[o.paymentType] || o.paymentType,
        o.status,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    return res.send(csv);
  })
);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order from a conversation (or manual) — quota-enforced
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Order created }
 *       403: { description: Monthly order quota exceeded }
 */
router.post(
  '/',
  requireAuth,
  enforceOrderQuota,
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await createOrder({
      seller: req.seller,
      tenantId: req.tenantId,
      input: req.body,
      ip: req.ip,
    });
    return ok(res, { order }, 201);
  })
);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Order detail
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Order }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, seller: req.tenantId })
      .populate('customer', 'name phones tags riskCache stats')
      .lean();
    if (!order) throw ApiError.notFound('Order not found');
    return ok(res, { order });
  })
);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Transition order status (validated + audit-logged)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties: { status: { type: string, enum: [pending, confirmed, shipped, delivered, returned, cancelled] } }
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Illegal transition }
 */
router.patch(
  '/:id/status',
  requireAuth,
  validate(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await changeOrderStatus({
      seller: req.seller,
      tenantId: req.tenantId,
      orderId: req.params.id,
      nextStatus: req.body.status,
      ip: req.ip,
    });
    return ok(res, { order });
  })
);

export default router;
