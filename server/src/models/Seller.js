import mongoose from 'mongoose';
import { PLANS } from '@dokaandm/shared';

const sellerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },

    plan: { type: String, enum: PLANS, default: 'free', index: true },
    planStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled'],
      default: 'active',
    },
    planRenewsAt: { type: Date },

    // Rolling monthly order counter for quota enforcement.
    orderCountThisPeriod: { type: Number, default: 0 },
    orderCountPeriodStart: { type: Date, default: () => new Date() },

    role: { type: String, enum: ['owner', 'staff'], default: 'owner' },
    parentSeller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null, index: true },

    lastLoginAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * The tenant id a seller's data lives under. Staff share their owner's tenant;
 * owners are their own tenant. EVERY tenant-scoped query uses this.
 */
sellerSchema.virtual('tenantId').get(function tenantId() {
  return this.parentSeller || this._id;
});

sellerSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const Seller = mongoose.model('Seller', sellerSchema);
