import mongoose from 'mongoose';
import { CHANNEL_TYPES, CONVERSATION_KINDS } from '@dokaandm/shared';

const conversationSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    channelType: { type: String, enum: CHANNEL_TYPES, required: true },
    kind: { type: String, enum: CONVERSATION_KINDS, default: 'dm' },
    externalThreadId: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    participantHandle: { type: String },
    participantExternalId: { type: String },
    lastMessageAt: { type: Date, default: () => new Date() },
    lastMessageSnippet: { type: String, maxlength: 280 },
    lastMessageDirection: { type: String, enum: ['inbound', 'outbound'] },
    unread: { type: Boolean, default: true },
    unreadCount: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'archived'], default: 'open' },
    hasOrder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Inbox list (primary paginated query).
conversationSchema.index({ seller: 1, lastMessageAt: -1 });
// Webhook thread lookup / idempotent upsert.
conversationSchema.index({ channel: 1, externalThreadId: 1 }, { unique: true });
conversationSchema.index({ seller: 1, unread: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, channelType: 1, lastMessageAt: -1 });
conversationSchema.index({ customer: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
