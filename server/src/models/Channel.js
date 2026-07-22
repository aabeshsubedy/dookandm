import mongoose from 'mongoose';
import { CHANNEL_TYPES } from '@dokaandm/shared';

const channelSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    type: { type: String, enum: CHANNEL_TYPES, required: true },
    externalId: { type: String, required: true }, // FB Page id / IG business account id
    name: { type: String, required: true },
    // AES-256-GCM encrypted long-lived page access token (never plaintext).
    pageAccessTokenEnc: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date },
    igLinkedPageId: { type: String }, // IG's backing FB page id
    webhookSubscribed: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disconnected', 'error'], default: 'active' },
    scopes: [{ type: String }],
  },
  { timestamps: true }
);

channelSchema.index({ seller: 1, type: 1 });
channelSchema.index({ seller: 1, status: 1 });
// A given external page/account maps to exactly one channel record.
channelSchema.index({ externalId: 1, type: 1 }, { unique: true });

channelSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.pageAccessTokenEnc;
  delete obj.__v;
  return obj;
};

export const Channel = mongoose.model('Channel', channelSchema);
