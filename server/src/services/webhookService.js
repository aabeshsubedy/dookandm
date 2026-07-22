import crypto from 'node:crypto';
import { logger } from '../config/logger.js';
import { Channel } from '../models/Channel.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { resolveByChannelIdentity } from './identityService.js';
import { publish } from './realtime.js';

const WEBHOOK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Process a verified Meta webhook payload. Idempotent + tenant-safe.
 * Handles Messenger + Instagram messaging events (and is structured so comment
 * events slot in the same way once App Review unlocks them in production).
 */
export async function processWebhookPayload(body) {
  if (!body || !Array.isArray(body.entry)) return;
  const objectType = body.object; // 'page' | 'instagram'

  for (const entry of body.entry) {
    const messaging = entry.messaging || entry.standby || [];
    for (const event of messaging) {
      await handleMessagingEvent({ objectType, entry, event }).catch((err) =>
        logger.error({ err: err.message }, 'Failed to process messaging event')
      );
    }
  }
}

async function handleMessagingEvent({ objectType, entry, event }) {
  const message = event.message;
  if (!message || message.is_echo) return; // ignore echoes/read receipts for MVP

  const externalMessageId = message.mid;
  const dedupeKey = externalMessageId || crypto.randomUUID();

  // Idempotency guard — skip already-seen events.
  const existing = await WebhookEvent.findOne({ dedupeKey }).lean();
  if (existing) return;
  await WebhookEvent.create({
    dedupeKey,
    channelType: objectType === 'instagram' ? 'instagram' : 'facebook',
    status: 'pending',
    expiresAt: new Date(Date.now() + WEBHOOK_TTL_MS),
  });

  const pageOrIgId = String(entry.id);
  const channelType = objectType === 'instagram' ? 'instagram' : 'facebook';

  // Resolve the receiving channel (tenant owner). For FB, entry.id is the page id;
  // for IG, it's the IG business account id.
  const channel = await Channel.findOne({
    externalId: pageOrIgId,
    type: channelType,
  });
  if (!channel) {
    logger.warn({ pageOrIgId, channelType }, 'Webhook for unknown channel — ignoring');
    await WebhookEvent.updateOne({ dedupeKey }, { $set: { status: 'failed', error: 'no channel' } });
    return;
  }

  const sellerId = channel.seller;
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  // Inbound if the sender is the customer (not the page itself).
  const direction = senderId === pageOrIgId ? 'outbound' : 'inbound';
  const participantExternalId = direction === 'inbound' ? senderId : recipientId;

  const externalThreadId = participantExternalId; // 1:1 DM thread keyed by participant

  // Resolve/attach the customer by channel handle (provisional until a phone appears).
  const customer = await resolveByChannelIdentity({
    sellerId,
    channelId: channel._id,
    channelType,
    externalUserId: participantExternalId,
    handle: undefined,
  });

  const now = message.timestamp ? new Date(Number(event.timestamp || message.timestamp)) : new Date();
  const snippet = (message.text || '[attachment]').slice(0, 200);

  const conversation = await Conversation.findOneAndUpdate(
    { channel: channel._id, externalThreadId },
    {
      $setOnInsert: {
        seller: sellerId,
        channel: channel._id,
        channelType,
        kind: 'dm',
        externalThreadId,
        participantExternalId,
        customer: customer._id,
      },
      $set: {
        lastMessageAt: now,
        lastMessageSnippet: snippet,
        lastMessageDirection: direction,
        ...(direction === 'inbound' ? { unread: true } : {}),
      },
      ...(direction === 'inbound' ? { $inc: { unreadCount: 1 } } : {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const msg = await Message.create({
    seller: sellerId,
    conversation: conversation._id,
    channelType,
    direction,
    externalMessageId,
    text: message.text,
    attachments: (message.attachments || []).map((a) => ({
      type: a.type,
      url: a.payload?.url,
    })),
    senderExternalId: senderId,
    status: direction === 'inbound' ? 'received' : 'delivered',
    sentAt: now,
  });

  await WebhookEvent.updateOne(
    { dedupeKey },
    { $set: { status: 'processed', processedAt: new Date() } }
  );

  publish(sellerId, 'message.new', {
    conversationId: String(conversation._id),
    messageId: String(msg._id),
    direction,
    snippet,
  });
}
