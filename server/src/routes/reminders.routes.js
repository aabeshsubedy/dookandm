import { Router } from 'express';
import mongoose from 'mongoose';
import { createReminderSchema, updateReminderSchema, ACTIVITY_ACTIONS, FEATURES } from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan.js';
import { asyncHandler, ok, paginated, parsePagination } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { Reminder } from '../models/Reminder.js';
import { recordActivity } from '../services/activityService.js';

const router = Router();

// Reminders are part of the CRM feature set (paid).
router.use(requireAuth, requireFeature(FEATURES.CRM));

/**
 * @openapi
 * /reminders:
 *   get:
 *     tags: [Reminders]
 *     summary: List reminders (paginated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [open, done] } }
 *       - { in: query, name: due, schema: { type: string, enum: [today, overdue] } }
 *     responses:
 *       200: { description: Paginated reminders }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { seller: req.tenantId };
    if (req.query.status) query.status = String(req.query.status);
    if (req.query.due === 'overdue') {
      query.status = 'open';
      query.dueAt = { $lt: new Date() };
    } else if (req.query.due === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      query.status = 'open';
      query.dueAt = { $gte: start, $lte: end };
    }
    const [items, total] = await Promise.all([
      Reminder.find(query).sort({ dueAt: 1 }).skip(skip).limit(limit).populate('customer', 'name phones').lean(),
      Reminder.countDocuments(query),
    ]);
    return paginated(res, items, { page, limit, total });
  })
);

/**
 * @openapi
 * /reminders:
 *   post:
 *     tags: [Reminders]
 *     summary: Create a follow-up reminder
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 */
router.post(
  '/',
  validate(createReminderSchema),
  asyncHandler(async (req, res) => {
    const doc = { seller: req.tenantId, title: req.body.title, dueAt: req.body.dueAt };
    if (req.body.customerId && mongoose.isValidObjectId(req.body.customerId)) {
      doc.customer = req.body.customerId;
    }
    const reminder = await Reminder.create(doc);
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.REMINDER_CREATED,
      entityType: 'Reminder',
      entityId: reminder._id,
      ip: req.ip,
    });
    return ok(res, { reminder }, 201);
  })
);

/**
 * @openapi
 * /reminders/{id}:
 *   patch:
 *     tags: [Reminders]
 *     summary: Complete or reschedule a reminder
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  '/:id',
  validate(updateReminderSchema),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (req.body.status === 'done') update.completedAt = new Date();
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, seller: req.tenantId },
      { $set: update },
      { new: true }
    );
    if (!reminder) throw ApiError.notFound('Reminder not found');
    if (req.body.status === 'done') {
      await recordActivity({
        seller: req.tenantId,
        actor: req.seller._id,
        action: ACTIVITY_ACTIONS.REMINDER_COMPLETED,
        entityType: 'Reminder',
        entityId: reminder._id,
        ip: req.ip,
      });
    }
    return ok(res, { reminder });
  })
);

/**
 * @openapi
 * /reminders/{id}:
 *   delete:
 *     tags: [Reminders]
 *     summary: Delete a reminder
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       204: { description: Deleted }
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Reminder.deleteOne({ _id: req.params.id, seller: req.tenantId });
    if (result.deletedCount === 0) throw ApiError.notFound('Reminder not found');
    return res.status(204).end();
  })
);

export default router;
