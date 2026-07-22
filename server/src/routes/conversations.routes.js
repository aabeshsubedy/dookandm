import { Router } from 'express';
import mongoose from 'mongoose';
import { sendMessageSchema, conversationFilterSchema } from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ok, paginated, parsePagination } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Order } from '../models/Order.js';
import { enqueueOutbound } from '../services/messageQueue.js';
import { containsRegex } from '../lib/sanitize.js';

const router = Router();

/**
 * @openapi
 * /conversations:
 *   get:
 *     tags: [Inbox]
 *     summary: List conversations (unified inbox), paginated + filterable
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: channelType, schema: { type: string, enum: [facebook, instagram] } }
 *       - { in: query, name: unread, schema: { type: string, enum: ["true","false"] } }
 *       - { in: query, name: hasOrder, schema: { type: string, enum: ["true","false"] } }
 *       - { in: query, name: q, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated conversations }
 */
router.get(
  '/',
  requireAuth,
  validate(conversationFilterSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const f = req.validatedQuery;
    const query = { seller: req.tenantId };
    if (f.channelType) query.channelType = f.channelType;
    if (f.kind) query.kind = f.kind;
    if (f.unread === 'true') query.unread = true;
    if (f.hasOrder === 'true') query.hasOrder = true;
    if (f.q) query.participantHandle = containsRegex(f.q);

    const [items, total] = await Promise.all([
      Conversation.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name phones riskCache tags')
        .lean(),
      Conversation.countDocuments(query),
    ]);
    return paginated(res, items, { page, limit, total });
  })
);

/**
 * @openapi
 * /conversations/{id}:
 *   get:
 *     tags: [Inbox]
 *     summary: Conversation detail with linked customer + orders
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Conversation }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({ _id: req.params.id, seller: req.tenantId })
      .populate('customer', 'name phones tags riskCache stats')
      .lean();
    if (!conversation) throw ApiError.notFound('Conversation not found');
    const orders = await Order.find({ seller: req.tenantId, conversation: conversation._id })
      .sort({ createdAt: -1 })
      .lean();
    return ok(res, { conversation, orders });
  })
);

/**
 * @openapi
 * /conversations/{id}/messages:
 *   get:
 *     tags: [Inbox]
 *     summary: Paginated messages in a conversation (oldest→newest)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated messages }
 */
router.get(
  '/:id/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!conversation) throw ApiError.notFound('Conversation not found');
    const { page, limit, skip } = parsePagination(req.query);
    const query = { conversation: conversation._id };
    const [items, total] = await Promise.all([
      Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments(query),
    ]);
    // Return chronological (oldest first) for rendering.
    return paginated(res, items.reverse(), { page, limit, total });
  })
);

/**
 * @openapi
 * /conversations/{id}/messages:
 *   post:
 *     tags: [Inbox]
 *     summary: Send a reply (queued through the native Meta channel, rate-limit aware)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [text], properties: { text: { type: string } } }
 *     responses:
 *       201: { description: Message queued }
 */
router.post(
  '/:id/messages',
  requireAuth,
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!conversation) throw ApiError.notFound('Conversation not found');
    if (!conversation.participantExternalId) {
      throw ApiError.badRequest('This conversation has no reachable recipient.');
    }

    const message = await Message.create({
      seller: req.tenantId,
      conversation: conversation._id,
      channelType: conversation.channelType,
      direction: 'outbound',
      text: req.body.text,
      status: 'queued',
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessageSnippet = req.body.text.slice(0, 200);
    conversation.lastMessageDirection = 'outbound';
    conversation.unread = false;
    conversation.unreadCount = 0;
    await conversation.save();

    enqueueOutbound({
      messageId: message._id,
      channelId: conversation.channel,
      recipientId: conversation.participantExternalId,
      text: req.body.text,
    });

    return ok(res, { message }, 201);
  })
);

/**
 * @openapi
 * /conversations/{id}:
 *   patch:
 *     tags: [Inbox]
 *     summary: Mark read/unread or archive a conversation
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unread: { type: boolean }
 *               status: { type: string, enum: [open, archived] }
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid id');
    const update = {};
    if (typeof req.body.unread === 'boolean') {
      update.unread = req.body.unread;
      if (!req.body.unread) update.unreadCount = 0;
    }
    if (req.body.status === 'open' || req.body.status === 'archived') update.status = req.body.status;
    if (Object.keys(update).length === 0) throw ApiError.badRequest('Nothing to update');

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, seller: req.tenantId },
      { $set: update },
      { new: true }
    );
    if (!conversation) throw ApiError.notFound('Conversation not found');
    return ok(res, { conversation });
  })
);

export default router;
