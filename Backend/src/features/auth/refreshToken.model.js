import { Schema, model, Types } from 'mongoose';

// Each login starts a token "family". Rotating a token revokes it and issues the
// next one in the same family, so reuse of a revoked token can kill the whole chain.
const refreshTokenSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    family: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    // Set only when revoked because it was exchanged for a newer token.
    rotatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model('RefreshToken', refreshTokenSchema);
