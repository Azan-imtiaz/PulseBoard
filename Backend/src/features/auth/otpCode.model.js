import { Schema, model, Types } from 'mongoose';

// One live code per user and purpose. MongoDB's TTL index deletes expired codes on
// its own (within about a minute of expiresAt); lookups also check expiresAt.
const otpCodeSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, enum: ['verify', 'reset'], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

otpCodeSchema.index({ user: 1, purpose: 1 }, { unique: true });
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCodeModel = model('OtpCode', otpCodeSchema);
