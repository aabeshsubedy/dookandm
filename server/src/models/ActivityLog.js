import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    meta: { type: mongoose.Schema.Types.Mixed }, // before/after diff — never secrets
    ip: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ seller: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
