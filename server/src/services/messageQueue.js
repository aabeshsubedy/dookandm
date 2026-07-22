import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { decryptSecret } from '../lib/crypto.js';
import { Channel } from '../models/Channel.js';
import { Message } from '../models/Message.js';
import { sendMessage as metaSend } from './metaService.js';
import { publish } from './realtime.js';

/**
 * Outbound message queue with per-channel rate limiting + backoff.
 *
 * Meta caps automated messages at ~200/hour/account. We enforce a per-channel
 * token budget (sliding hour window) so over-cap sends are QUEUED, not dropped,
 * and drained as budget frees up. Failures back off with retries.
 *
 * In-memory for the MVP (single instance). For horizontal scale this moves to a
 * durable queue (BullMQ/Redis) — flagged in DEPLOYMENT.md.
 */
const PER_HOUR = env.META_MESSAGE_RATE_LIMIT_PER_HOUR;
const sentTimestampsByChannel = new Map(); // channelId -> number[] (ms)
const queue = []; // { messageId, channelId, recipientId, text, attempts }
let draining = false;

function budgetRemaining(channelId) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const arr = (sentTimestampsByChannel.get(String(channelId)) || []).filter((t) => t > windowStart);
  sentTimestampsByChannel.set(String(channelId), arr);
  return PER_HOUR - arr.length;
}

function recordSend(channelId) {
  const key = String(channelId);
  const arr = sentTimestampsByChannel.get(key) || [];
  arr.push(Date.now());
  sentTimestampsByChannel.set(key, arr);
}

/** Enqueue a persisted outbound message for delivery. Returns immediately. */
export function enqueueOutbound({ messageId, channelId, recipientId, text }) {
  queue.push({ messageId, channelId, recipientId, text, attempts: 0 });
  scheduleDrain(0);
}

function scheduleDrain(delayMs) {
  if (draining) return;
  draining = true;
  setTimeout(drain, delayMs).unref?.();
}

async function drain() {
  draining = false;
  if (queue.length === 0) return;

  const job = queue[0];
  if (budgetRemaining(job.channelId) <= 0) {
    // Over cap — wait ~5 min then retry the queue head.
    logger.warn({ channelId: job.channelId }, 'Message rate cap reached — queueing');
    return scheduleDrain(5 * 60 * 1000);
  }

  queue.shift();
  try {
    const channel = await Channel.findById(job.channelId).select('+pageAccessTokenEnc externalId');
    if (!channel) throw new Error('Channel not found');

    if (env.metaConfigured) {
      const accessToken = decryptSecret(channel.pageAccessTokenEnc);
      const result = await metaSend({
        pageId: channel.externalId,
        recipientId: job.recipientId,
        text: job.text,
        accessToken,
      });
      await markSent(job.messageId, result?.message_id);
    } else {
      // Dev/test mode: no live Meta — mark as sent so the UX flow works.
      await markSent(job.messageId, null);
    }
    recordSend(job.channelId);
  } catch (err) {
    job.attempts += 1;
    if (err.rateLimited || err.metaCode) {
      queue.unshift(job); // put it back; wait then retry
      logger.warn({ err: err.message }, 'Meta rate-limited outbound — backing off');
      return scheduleDrain(5 * 60 * 1000);
    }
    if (job.attempts < 3) {
      queue.push(job);
      logger.warn({ err: err.message, attempts: job.attempts }, 'Retrying outbound message');
    } else {
      await markFailed(job.messageId, err.message);
      logger.error({ err: err.message, messageId: job.messageId }, 'Outbound message failed');
    }
  }

  if (queue.length > 0) scheduleDrain(250);
}

async function markSent(messageId, externalMessageId) {
  const msg = await Message.findByIdAndUpdate(
    messageId,
    { $set: { status: 'sent', sentAt: new Date(), ...(externalMessageId ? { externalMessageId } : {}) } },
    { new: true }
  );
  if (msg) publish(msg.seller, 'message.sent', { messageId: String(msg._id), conversationId: String(msg.conversation) });
}

async function markFailed(messageId, error) {
  const msg = await Message.findByIdAndUpdate(
    messageId,
    { $set: { status: 'failed', error } },
    { new: true }
  );
  if (msg) publish(msg.seller, 'message.failed', { messageId: String(msg._id), conversationId: String(msg.conversation) });
}

export { budgetRemaining };
