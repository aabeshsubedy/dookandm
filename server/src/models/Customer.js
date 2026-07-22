import mongoose from 'mongoose';
import { RISK_LABELS } from '@dokaandm/shared';

const channelIdentitySchema = new mongoose.Schema(
  {
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
    type: { type: String, enum: ['facebook', 'instagram'] },
    externalUserId: { type: String }, // PSID / IG user id
    handle: { type: String },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: () => new Date() },
    editedAt: { type: Date },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, trim: true, maxlength: 120 },
    // Normalized E.164-ish phones — the PRIMARY identity key.
    phones: [{ type: String }],
    channelIdentities: [channelIdentitySchema],
    tags: [{ type: String, trim: true, maxlength: 40 }],
    notes: [noteSchema],
    isProvisional: { type: Boolean, default: false }, // true until a phone is known
    riskCache: {
      label: { type: String, enum: RISK_LABELS },
      totalCompleted: Number,
      deliveredOrders: Number,
      returnedOrders: Number,
      returnRate: Number,
      computedAt: Date,
    },
    stats: {
      totalOrders: { type: Number, default: 0 },
      lifetimeValuePaisa: { type: Number, default: 0 },
      lastOrderAt: { type: Date },
    },
  },
  { timestamps: true }
);

// ── Critical indexes ──
// Phone-number identity resolution within a tenant (multikey).
customerSchema.index({ seller: 1, phones: 1 });
// Resolve provisional customers from webhook channel handles.
customerSchema.index({ seller: 1, 'channelIdentities.externalUserId': 1 });
customerSchema.index({ seller: 1, tags: 1 });
customerSchema.index({ seller: 1, createdAt: -1 });
// Text search on name for the CRM search box.
customerSchema.index({ seller: 1, name: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
