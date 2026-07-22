import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true }, // sha256 of raw token
    family: { type: String, required: true }, // rotation family for reuse detection
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String }, // tokenHash of successor
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

// TTL index — expired tokens are auto-purged by MongoDB.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ seller: 1, family: 1 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
