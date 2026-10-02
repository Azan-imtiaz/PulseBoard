import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Unique handle used for sign-in and @mentions. The unique index is what
    // actually guarantees uniqueness; the availability check is only a hint.
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    // Accounts can't sign in until they've confirmed their email with a code.
    emailVerifiedAt: { type: Date, default: null },
    passwordHash: { type: String, required: true, select: false },
    // Stable per-user hue for avatars and live cursors.
    color: { type: String, required: true },
    // Optional profile photo; avatars fall back to initials on `color`.
    avatarUrl: { type: String, default: null },
    // Shared accounts for the public demo. They never receive email and can't
    // make changes that would spoil the demo for the next visitor.
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const UserModel = model('User', userSchema);

export function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    color: user.color,
    avatarUrl: user.avatarUrl ?? null,
    isDemo: Boolean(user.isDemo),
  };
}
