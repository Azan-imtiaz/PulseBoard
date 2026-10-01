import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../../config.js';
import { HttpError } from '../../lib/errors.js';
import { OtpCodeModel } from './otpCode.model.js';

// One-time codes for email verification and password resets.
const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

// Keyed hash so a database dump doesn't reveal live codes.
const hashCode = (code) => createHmac('sha256', config.JWT_ACCESS_SECRET).update(code).digest('hex');

export async function issueOtp(purpose, userId) {
  const now = Date.now();
  const existing = await OtpCodeModel.findOne({ user: userId, purpose }).lean();
  const sinceLastSend = existing ? now - existing.sentAt.getTime() : Infinity;

  if (sinceLastSend < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - sinceLastSend) / 1000);
    throw new HttpError(429, `Please wait ${retryAfter}s before requesting another code`, 'otp_cooldown', {
      retryAfter,
    });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await OtpCodeModel.findOneAndUpdate(
    { user: userId, purpose },
    { codeHash: hashCode(code), attempts: 0, sentAt: new Date(now), expiresAt: new Date(now + CODE_TTL_MS) },
    { upsert: true },
  );
  return code;
}

export async function consumeOtp(purpose, userId, code) {
  // Counted before comparing, so parallel guesses can't get more than their share.
  const otp = await OtpCodeModel.findOneAndUpdate(
    { user: userId, purpose, expiresAt: { $gt: new Date() } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!otp) throw new HttpError(400, 'That code has expired. Request a new one.', 'otp_expired');

  const matches =
    /^\d{6}$/.test(code) && timingSafeEqual(Buffer.from(otp.codeHash, 'hex'), Buffer.from(hashCode(code), 'hex'));

  if (matches && otp.attempts <= MAX_ATTEMPTS) {
    await otp.deleteOne();
    return;
  }

  const left = MAX_ATTEMPTS - otp.attempts;
  if (left > 0) {
    throw new HttpError(400, `That code isn't right. ${left} ${left === 1 ? 'try' : 'tries'} left.`, 'otp_invalid');
  }
  await otp.deleteOne();
  throw new HttpError(400, 'Too many wrong attempts. Request a new code.', 'otp_locked');
}

export const OTP_TTL_MINUTES = CODE_TTL_MS / 60_000;
