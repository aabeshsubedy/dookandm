import { Router } from 'express';
import { env } from '../config/env.js';
import { webhookLimiter } from '../middleware/rateLimit.js';
import { verifyWebhookSignature } from '../services/metaService.js';
import { processWebhookPayload } from '../services/webhookService.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * @openapi
 * /webhooks/meta:
 *   get:
 *     tags: [Webhooks]
 *     summary: Meta webhook verification handshake
 *     parameters:
 *       - { in: query, name: "hub.mode", schema: { type: string } }
 *       - { in: query, name: "hub.verify_token", schema: { type: string } }
 *       - { in: query, name: "hub.challenge", schema: { type: string } }
 *     responses:
 *       200: { description: Echoes hub.challenge when the verify token matches }
 *       403: { description: Verify token mismatch }
 */
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * @openapi
 * /webhooks/meta:
 *   post:
 *     tags: [Webhooks]
 *     summary: Receive Meta message/comment events (signature-verified)
 *     responses:
 *       200: { description: Acknowledged (always 200 to Meta once signature is valid) }
 *       401: { description: Invalid signature }
 */
router.post('/meta', webhookLimiter, (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const valid = verifyWebhookSignature(req.rawBody || Buffer.from(''), signature);
  if (!valid) {
    logger.warn('Rejected webhook with invalid X-Hub-Signature-256');
    return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Bad signature' } });
  }

  // Acknowledge immediately; process asynchronously so Meta never times out.
  res.sendStatus(200);
  processWebhookPayload(req.body).catch((err) =>
    logger.error({ err: err.message }, 'Webhook processing error')
  );
});

export default router;
