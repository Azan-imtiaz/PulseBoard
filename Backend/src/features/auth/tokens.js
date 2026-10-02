import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';
import { HttpError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { RefreshTokenModel } from './refreshToken.model.js';

// Two tabs refreshing at once will both send the same cookie. The loser of that race
// shouldn't be treated as token theft, so a token revoked this recently gets a
// retryable error instead of killing the session.
const ROTATION_GRACE_MS = 10_000;

// Demo accounts carry a `demo` claim so request guards can check it without a
// database lookup.
export function signAccessToken(userId, { demo = false } = {}) {
  return jwt.sign(demo ? { demo: true } : {}, config.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: config.ACCESS_TOKEN_TTL,
  });
}

export function readAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET);
    if (typeof payload !== 'object' || !payload.sub) return null;
    return { userId: payload.sub, demo: payload.demo === true };
  } catch {
    return null;
  }
}

export function verifyAccessToken(token) {
  return readAccessToken(token)?.userId ?? null;
}

const hash = (token) => createHash('sha256').update(token).digest('hex');

export async function issueRefreshToken(userId, family = randomUUID()) {
  const token = randomBytes(48).toString('base64url');
  await RefreshTokenModel.create({
    user: userId,
    family,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return token;
}

export async function rotateRefreshToken(token) {
  const now = new Date();
  const claimed = await RefreshTokenModel.findOneAndUpdate(
    { tokenHash: hash(token), revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, rotatedAt: now } },
  );

  if (claimed) {
    const userId = String(claimed.user);
    return { userId, token: await issueRefreshToken(userId, claimed.family) };
  }

  const existing = await RefreshTokenModel.findOne({ tokenHash: hash(token) });
  if (!existing || existing.expiresAt <= now) {
    throw new HttpError(401, 'Your session has expired', 'session_expired');
  }

  // Revoked by sign-out or a password reset rather than by rotation: just over.
  if (!existing.rotatedAt) throw new HttpError(401, 'Your session has ended. Please sign in again.', 'session_revoked');

  const rotatedAgo = now.getTime() - existing.rotatedAt.getTime();
  if (rotatedAgo < ROTATION_GRACE_MS) {
    throw new HttpError(409, 'Session was refreshed by another request', 'refresh_race');
  }

  // A long-revoked token being replayed means it leaked. End every session in the family.
  await RefreshTokenModel.updateMany({ family: existing.family, revokedAt: null }, { $set: { revokedAt: now } });
  logger.warn({ userId: String(existing.user), family: existing.family }, 'refresh token reuse detected');
  throw new HttpError(401, 'Your session has ended. Please sign in again.', 'session_revoked');
}

export async function revokeFamilyOf(token) {
  const existing = await RefreshTokenModel.findOne({ tokenHash: hash(token) });
  if (!existing) return;
  await RefreshTokenModel.updateMany({ family: existing.family, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
