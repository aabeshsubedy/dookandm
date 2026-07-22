import { Router } from 'express';
import {
  createCustomerSchema,
  updateCustomerSchema,
  noteSchema,
  normalizePhone,
  ACTIVITY_ACTIONS,
  FEATURES,
} from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature, enforceCustomerQuota } from '../middleware/plan.js';
import { asyncHandler, ok, paginated, parsePagination } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { Reminder } from '../models/Reminder.js';
import { containsRegex } from '../lib/sanitize.js';
import { recordActivity } from '../services/activityService.js';
import { computeCustomerRisk } from '../services/riskService.js';

const router = Router();

/**
 * @openapi
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: List/search customers (paginated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: tag, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated customers }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { seller: req.tenantId };
    if (req.query.tag) query.tags = String(req.query.tag);
    if (req.query.q) {
      const rx = containsRegex(req.query.q);
      query.$or = [{ name: rx }, { phones: rx }];
    }
    const [items, total] = await Promise.all([
      Customer.find(query).sort({ 'stats.lastOrderAt': -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(query),
    ]);
    return paginated(res, items, { page, limit, total });
  })
);

/**
 * @openapi
 * /customers:
 *   post:
 *     tags: [Customers]
 *     summary: Manually create a customer (quota-enforced)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 *       403: { description: Customer quota exceeded }
 */
router.post(
  '/',
  requireAuth,
  enforceCustomerQuota,
  validate(createCustomerSchema),
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    if (!phone) throw ApiError.badRequest('Enter a valid phone number');

    const existing = await Customer.findOne({ seller: req.tenantId, phones: phone });
    if (existing) throw ApiError.conflict('A customer with that phone already exists', 'CUSTOMER_EXISTS');

    const customer = await Customer.create({
      seller: req.tenantId,
      name: req.body.name,
      phones: [phone],
      tags: req.body.tags || [],
      notes: req.body.note ? [{ body: req.body.note }] : [],
      isProvisional: false,
    });
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.CUSTOMER_CREATED,
      entityType: 'Customer',
      entityId: customer._id,
      ip: req.ip,
    });
    return ok(res, { customer }, 201);
  })
);

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Customer profile with order history + reminders + risk
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Customer profile }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, seller: req.tenantId }).lean();
    if (!customer) throw ApiError.notFound('Customer not found');
    const [orders, reminders] = await Promise.all([
      Order.find({ seller: req.tenantId, customer: customer._id }).sort({ createdAt: -1 }).lean(),
      Reminder.find({ seller: req.tenantId, customer: customer._id }).sort({ dueAt: 1 }).lean(),
    ]);
    return ok(res, { customer, orders, reminders });
  })
);

/**
 * @openapi
 * /customers/{id}:
 *   patch:
 *     tags: [Customers]
 *     summary: Update name / phones / tags
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  '/:id',
  requireAuth,
  validate(updateCustomerSchema),
  asyncHandler(async (req, res) => {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.tags !== undefined) update.tags = req.body.tags;
    if (req.body.phones !== undefined) {
      update.phones = req.body.phones.map((p) => normalizePhone(p)).filter(Boolean);
    }
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, seller: req.tenantId },
      { $set: update },
      { new: true }
    );
    if (!customer) throw ApiError.notFound('Customer not found');
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.CUSTOMER_UPDATED,
      entityType: 'Customer',
      entityId: customer._id,
      meta: { fields: Object.keys(update) },
      ip: req.ip,
    });
    return ok(res, { customer });
  })
);

/**
 * @openapi
 * /customers/{id}/notes:
 *   post:
 *     tags: [Customers]
 *     summary: Add a note (CRM feature — paid)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       201: { description: Note added }
 */
router.post(
  '/:id/notes',
  requireAuth,
  requireFeature(FEATURES.CRM),
  validate(noteSchema),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!customer) throw ApiError.notFound('Customer not found');
    customer.notes.push({ body: req.body.body });
    await customer.save();
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.CUSTOMER_NOTE_ADDED,
      entityType: 'Customer',
      entityId: customer._id,
      ip: req.ip,
    });
    return ok(res, { customer }, 201);
  })
);

/**
 * @openapi
 * /customers/{id}/notes/{noteId}:
 *   patch:
 *     tags: [Customers]
 *     summary: Edit a note (audit-logged)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  '/:id/notes/:noteId',
  requireAuth,
  requireFeature(FEATURES.CRM),
  validate(noteSchema),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!customer) throw ApiError.notFound('Customer not found');
    const note = customer.notes.id(req.params.noteId);
    if (!note) throw ApiError.notFound('Note not found');
    note.body = req.body.body;
    note.editedAt = new Date();
    await customer.save();
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.CUSTOMER_NOTE_EDITED,
      entityType: 'Customer',
      entityId: customer._id,
      meta: { noteId: req.params.noteId },
      ip: req.ip,
    });
    return ok(res, { customer });
  })
);

/**
 * @openapi
 * /customers/{id}/risk:
 *   get:
 *     tags: [Customers]
 *     summary: COD risk breakdown for a customer (paid)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Risk breakdown }
 */
router.get(
  '/:id/risk',
  requireAuth,
  requireFeature(FEATURES.COD_RISK),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, seller: req.tenantId }).lean();
    if (!customer) throw ApiError.notFound('Customer not found');
    const { risk } = await computeCustomerRisk(req.tenantId, customer._id);
    return ok(res, { risk });
  })
);

export default router;
