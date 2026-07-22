import mongoose from 'mongoose';
import { CHANNEL_TYPES, MESSAGE_DIRECTIONS, MESSAGE_STATUS } from '@dokaandm/shared';

const attachmentSchema = new mongoose.Schema(
  { type: { type: String }, url: { type: String } },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    channelType: { type: String, enum: CHANNEL_TYPES, required: true },
    direction: { type: String, enum: MESSAGE_DIRECTIONS, required: true },
    externalMessageId: { type: String }, // Meta message id (dedupe)
    text: { type: String },
    attachments: [attachmentSchema],
    senderExternalId: { type: String },
    status: { type: String, enum: MESSAGE_STATUS, default: 'received' },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 }); // thread render
messageSchema.index({ externalMessageId: 1 }, { unique: true, sparse: true }); // idempotent webhook
messageSchema.index({ seller: 1, text: 'text' }); // search

export const Message = mongoose.model('Message', messageSchema);
