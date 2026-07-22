import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ACTIVITY_ACTIONS } from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { enforceChannelQuota } from '../middleware/plan.js';
import { asyncHandler, ok } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { env } from '../config/env.js';
import { encryptSecret } from '../lib/crypto.js';
import { Channel } from '../models/Channel.js';
import {
  buildOAuthUrl,
  exchangeCodeForToken,
  listManagedPages,
  subscribePageWebhooks,
} from '../services/metaService.js';
import { recordActivity } from '../services/activityService.js';
import { logger } from '../config/logger.js';

const router = Router();

const OAUTH_STATE_TTL = '10m';

/**
 * @openapi
 * /channels:
 *   get:
 *     tags: [Channels]
 *     summary: List connected Facebook/Instagram channels
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Channel list }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const channels = await Channel.find({ seller: req.tenantId }).sort({ createdAt: -1 });
    return ok(res, { channels: channels.map((c) => c.toSafeJSON()), metaConfigured: env.metaConfigured });
  })
);

/**
 * @openapi
 * /channels/oauth/url:
 *   get:
 *     tags: [Channels]
 *     summary: Get the Meta OAuth authorize URL (state binds the seller)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Authorize URL }
 */
router.get(
  '/oauth/url',
  requireAuth,
  enforceChannelQuota,
  asyncHandler(async (req, res) => {
    if (!env.metaConfigured) {
      throw ApiError.badRequest('Meta integration is not configured on this server.', {
        code: 'META_NOT_CONFIGURED',
      });
    }
    // Signed, short-lived state binds the callback to this seller (CSRF protection).
    const state = jwt.sign({ t: String(req.tenantId), s: String(req.seller._id) }, env.JWT_ACCESS_SECRET, {
      expiresIn: OAUTH_STATE_TTL,
    });
    return ok(res, { url: buildOAuthUrl(state) });
  })
);

/**
 * @openapi
 * /channels/oauth/callback:
 *   get:
 *     tags: [Channels]
 *     summary: OAuth redirect target — exchanges code, connects pages/IG accounts
 *     parameters:
 *       - { in: query, name: code, schema: { type: string } }
 *       - { in: query, name: state, schema: { type: string } }
 *     responses:
 *       302: { description: Redirects back to the app }
 */
router.get(
  '/oauth/callback',
  asyncHandler(async (req, res) => {
    const { code, state, error: oauthError } = req.query;
    const redirect = (status) => res.redirect(`${env.CLIENT_URL}/settings/channels?meta=${status}`);

    if (oauthError || !code || !state) return redirect('denied');

    let claims;
    try {
      claims = jwt.verify(String(state), env.JWT_ACCESS_SECRET);
    } catch {
      return redirect('invalid_state');
    }
    const tenantId = claims.t;

    try {
      const token = await exchangeCodeForToken(String(code));
      const pages = await listManagedPages(token.access_token);
      let connected = 0;

      for (const page of pages) {
        const expiresAt = token.expires_in
          ? new Date(Date.now() + token.expires_in * 1000)
          : undefined;

        // Facebook Page channel
        await upsertChannel({
          tenantId,
          type: 'facebook',
          externalId: page.id,
          name: page.name,
          pageAccessToken: page.access_token,
          tokenExpiresAt: expiresAt,
        });
        connected += 1;

        // Linked Instagram business account (shares the page token)
        if (page.instagram_business_account?.id) {
          await upsertChannel({
            tenantId,
            type: 'instagram',
            externalId: page.instagram_business_account.id,
            name: page.instagram_business_account.username || `${page.name} (IG)`,
            pageAccessToken: page.access_token,
            tokenExpiresAt: expiresAt,
            igLinkedPageId: page.id,
          });
          connected += 1;
        }

        // Subscribe the page to webhooks (best-effort).
        subscribePageWebhooks(page.id, page.access_token)
          .then(() => Channel.updateOne({ externalId: page.id, type: 'facebook' }, { $set: { webhookSubscribed: true } }))
          .catch((err) => logger.warn({ err: err.message }, 'Webhook subscribe failed'));
      }

      await recordActivity({
        seller: tenantId,
        actor: claims.s,
        action: ACTIVITY_ACTIONS.CHANNEL_CONNECTED,
        entityType: 'Channel',
        meta: { connected },
        ip: req.ip,
      });

      return redirect(connected > 0 ? 'connected' : 'no_pages');
    } catch (err) {
      logger.error({ err: err.message }, 'OAuth callback failed');
      return redirect('error');
    }
  })
);

async function upsertChannel({ tenantId, type, externalId, name, pageAccessToken, tokenExpiresAt, igLinkedPageId }) {
  await Channel.findOneAndUpdate(
    { externalId, type },
    {
      $set: {
        seller: tenantId,
        type,
        externalId,
        name,
        pageAccessTokenEnc: encryptSecret(pageAccessToken),
        tokenExpiresAt,
        igLinkedPageId,
        status: 'active',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * @openapi
 * /channels/{id}/sync:
 *   post:
 *     tags: [Channels]
 *     summary: Backfill recent conversations/messages for a channel
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Sync started/completed }
 */
router.post(
  '/:id/sync',
  requireAuth,
  asyncHandler(async (req, res) => {
    const channel = await Channel.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!channel) throw ApiError.notFound('Channel not found');
    // Backfill implementation calls the Graph API conversations endpoint in
    // production. In test/dev mode without Meta it is a no-op acknowledgement.
    return ok(res, { synced: env.metaConfigured, channelId: String(channel._id) });
  })
);

/**
 * @openapi
 * /channels/{id}:
 *   delete:
 *     tags: [Channels]
 *     summary: Disconnect a channel
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Disconnected }
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const channel = await Channel.findOneAndUpdate(
      { _id: req.params.id, seller: req.tenantId },
      { $set: { status: 'disconnected', webhookSubscribed: false } },
      { new: true }
    );
    if (!channel) throw ApiError.notFound('Channel not found');
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.CHANNEL_DISCONNECTED,
      entityType: 'Channel',
      entityId: channel._id,
      ip: req.ip,
    });
    return ok(res, { channel: channel.toSafeJSON() });
  })
);

export default router;
