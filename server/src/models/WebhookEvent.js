import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    dedupeKey: { type: String, required: true, unique: true }, // Meta event id / hash
    channelType: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    processedAt: { type: Date },
    error: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    expiresAt: { type: Date, required: true }, // TTL cleanup
  },
  { timestamps: true }
);

webhookEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
