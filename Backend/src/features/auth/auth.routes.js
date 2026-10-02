import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../../config.js';
import { HttpError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { requireAuth } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { WorkspaceModel } from '../workspaces/workspace.model.js';
import { RefreshTokenModel } from './refreshToken.model.js';
import { UserModel, publicUser } from './user.model.js';
import { revokeFamilyOf, rotateRefreshToken } from './tokens.js';
import { REFRESH_COOKIE, accessTokenFor, clearRefreshCookie, setRefreshCookie, startSession } from './session.js';
import { colorFor } from './colors.js';
import { consumeOtp, issueOtp } from './otp.js';
import { sendPasswordResetCode, sendVerificationCode } from './emails.js';
import { passwordProblem } from './passwords.js';
import { checkUsernameFormat, isUsernameTaken, suggestUsernames } from './usernames.js';

export const authRouter = Router();

// Keyed by IP: these routes run before we know who the caller is. Sign-in, sign-up
// and codes share a strict budget; refresh and the username check get their own,
// because they fire on page loads and while typing.
const byIp = (req) => req.ip ?? 'unknown';
const authLimiter = rateLimit({ name: 'auth', limit: config.AUTH_RATE_LIMIT, windowMs: 60_000, key: byIp });
const refreshLimiter = rateLimit({ name: 'refresh', limit: 60, windowMs: 60_000, key: byIp });
const lookupLimiter = rateLimit({ name: 'username-lookup', limit: 60, windowMs: 60_000, key: byIp });

const email = z.email('Enter a valid email address').max(200).toLowerCase();
const username = z.string().trim().toLowerCase().max(40);
const password = z.string().max(200);
const code = z.string().trim();

const registerSchema = z.object({ name: z.string().trim().min(1).max(80), username, email, password });
const loginSchema = z.object({ identifier: z.string().trim().toLowerCase().min(1).max(200), password });

function assertPasswordOk(value, user) {
  const problem = passwordProblem(value, user);
  if (problem) throw new HttpError(400, problem, 'weak_password');
}

// Sends a fresh verification code unless one was sent in the last minute. Used on
// sign-up and when an unverified account tries to sign in.
async function sendVerification(user) {
  try {
    await sendVerificationCode(user, await issueOtp('verify', String(user._id)));
  } catch (err) {
    if (err instanceof HttpError && err.code === 'otp_cooldown') return;
    throw err;
  }
}

authRouter.get('/username-available', lookupLimiter, async (req, res) => {
  const value = username.parse(req.query.username ?? '');
  const name = z.string().max(80).catch('').parse(req.query.name);

  const formatProblem = checkUsernameFormat(value);
  const taken = !formatProblem && (await isUsernameTaken(value));
  const available = !formatProblem && !taken;

  res.json({
    username: value,
    available,
    reason: formatProblem ?? (taken ? 'That username is taken' : null),
    suggestions: available ? [] : await suggestUsernames(value, name),
  });
});

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);

  const formatProblem = checkUsernameFormat(input.username);
  if (formatProblem) throw new HttpError(400, formatProblem, 'invalid_username');
  assertPasswordOk(input.password, input);

  if (await UserModel.exists({ email: input.email })) {
    throw new HttpError(409, 'An account with that email already exists. Try signing in.', 'email_taken');
  }
  if (await isUsernameTaken(input.username)) {
    throw new HttpError(409, 'That username is taken', 'username_taken', {
      suggestions: await suggestUsernames(input.username, input.name),
    });
  }

  let user;
  try {
    user = await UserModel.create({
      email: input.email,
      username: input.username,
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, 12),
      color: colorFor(input.email),
    });
  } catch (err) {
    // Someone else claimed the username or email between our check and the insert.
    if (err?.code === 11000)
      throw new HttpError(409, 'That username or email was just taken. Try another.', 'duplicate');
    throw err;
  }

  await sendVerification(user);
  res.status(201).json({ status: 'verification_required', email: user.email });
});

authRouter.post('/verify-email', authLimiter, async (req, res) => {
  const input = z.object({ email, code }).parse(req.body);
  const user = await UserModel.findOne({ email: input.email });
  if (!user) throw new HttpError(400, 'That code has expired. Request a new one.', 'otp_expired');
  if (user.emailVerifiedAt)
    throw new HttpError(409, 'This email is already verified. Sign in instead.', 'already_verified');

  await consumeOtp('verify', String(user._id), input.code);

  user.emailVerifiedAt = new Date();
  await user.save();
  // The personal workspace is created on verification, so abandoned sign-ups
  // don't leave empty workspaces behind.
  await WorkspaceModel.create({
    name: `${user.name.split(' ')[0]}'s workspace`,
    members: [{ user: user._id, role: 'owner' }],
  });

  res.json(await startSession(res, user));
});

// Always answers the same way whether or not the email exists, so this can't be
// used to find out who has an account. Only the resend cooldown is reported.
authRouter.post('/resend-verification', authLimiter, async (req, res) => {
  const input = z.object({ email }).parse(req.body);
  const user = await UserModel.findOne({ email: input.email });
  if (user && !user.emailVerifiedAt) {
    await sendVerificationCode(user, await issueOtp('verify', String(user._id)));
  }
  res.json({ status: 'sent' });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const field = input.identifier.includes('@') ? 'email' : 'username';
  const user = await UserModel.findOne({ [field]: input.identifier }).select('+passwordHash');

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Incorrect email, username or password', 'invalid_credentials');
  }
  if (!user.emailVerifiedAt) {
    await sendVerification(user);
    throw new HttpError(403, 'Please confirm your email first. We sent you a code.', 'email_not_verified', {
      email: user.email,
    });
  }

  res.json(await startSession(res, user));
});

authRouter.post('/forgot-password', authLimiter, async (req, res) => {
  const input = z.object({ email }).parse(req.body);
  const user = await UserModel.findOne({ email: input.email });
  // Demo accounts use made-up addresses, so there's no inbox to send a code to.
  if (user && !user.isDemo) {
    try {
      await sendPasswordResetCode(user, await issueOtp('reset', String(user._id)));
    } catch (err) {
      // Stay silent about the cooldown too, or it would reveal the account exists.
      if (!(err instanceof HttpError && err.code === 'otp_cooldown')) throw err;
    }
  }
  res.json({ status: 'sent' });
});

authRouter.post('/reset-password', authLimiter, async (req, res) => {
  const input = z.object({ email, code, password }).parse(req.body);
  const user = await UserModel.findOne({ email: input.email });
  if (!user) throw new HttpError(400, 'That code has expired. Request a new one.', 'otp_expired');

  // Check the new password first so a weak one doesn't burn the code.
  assertPasswordOk(input.password, user);
  await consumeOtp('reset', String(user._id), input.code);

  user.passwordHash = await bcrypt.hash(input.password, 12);
  // Receiving the code proves they own the inbox, so the email counts as verified.
  user.emailVerifiedAt ??= new Date();
  await user.save();

  // Whoever knew the old password shouldn't stay signed in anywhere.
  await RefreshTokenModel.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  logger.info({ userId: String(user._id) }, 'password reset; all sessions revoked');

  if (!(await WorkspaceModel.exists({ 'members.user': user._id }))) {
    await WorkspaceModel.create({
      name: `${user.name.split(' ')[0]}'s workspace`,
      members: [{ user: user._id, role: 'owner' }],
    });
  }

  res.json(await startSession(res, user));
});

authRouter.post('/refresh', refreshLimiter, async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new HttpError(401, 'No active session', 'session_expired');

  const rotated = await rotateRefreshToken(token);
  const user = await UserModel.findById(rotated.userId);
  if (!user) throw new HttpError(401, 'No active session', 'session_expired');

  setRefreshCookie(res, rotated.token);
  res.json({ accessToken: accessTokenFor(user), user: publicUser(user) });
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeFamilyOf(token);
  clearRefreshCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.userId);
  if (!user) throw new HttpError(401, 'No active session', 'session_expired');
  res.json({ user: publicUser(user) });
});
