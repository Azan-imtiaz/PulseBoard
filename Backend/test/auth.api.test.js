// Sign-up with email codes, username rules and password reset, through the real
// HTTP API. Emails are captured instead of sent. Needs MongoDB.

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

const sent = vi.hoisted(() => []);
vi.mock('../src/services/email.js', () => ({
  sendEmail: async (email) => void sent.push(email),
}));

const { connectDb } = await import('../src/lib/db.js');
const { OtpCodeModel } = await import('../src/features/auth/otpCode.model.js');
const { createApp } = await import('../src/app.js');

const app = createApp();
const api = request(app);

const lastCodeFor = (email) => {
  const message = sent.findLast((m) => m.to === email);
  return message?.subject.match(/^(\d{6})/)?.[1];
};

const register = (overrides = {}) =>
  api.post('/api/v1/auth/register').send({
    name: 'Maya Chen',
    username: 'maya',
    email: 'maya@test.dev',
    password: 'correct horse battery',
    ...overrides,
  });

beforeAll(async () => {
  await connectDb();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  sent.length = 0;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('sign-up and email verification', () => {
  it('emails a code instead of signing you in', async () => {
    const res = await register().expect(201);
    expect(res.body).toEqual({ status: 'verification_required', email: 'maya@test.dev' });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(lastCodeFor('maya@test.dev')).toMatch(/^\d{6}$/);
  });

  it('blocks sign-in until the email is verified, and resends a code', async () => {
    await register();
    await OtpCodeModel.deleteMany({}); // skip the resend cooldown

    const res = await api
      .post('/api/v1/auth/login')
      .send({ identifier: 'maya', password: 'correct horse battery' })
      .expect(403);
    expect(res.body.error).toMatchObject({ code: 'email_not_verified', email: 'maya@test.dev' });
    expect(sent).toHaveLength(2);
  });

  it('signs you in once the right code is entered, with a personal workspace', async () => {
    await register();
    const res = await api
      .post('/api/v1/auth/verify-email')
      .send({ email: 'maya@test.dev', code: lastCodeFor('maya@test.dev') })
      .expect(200);

    expect(res.body.user).toMatchObject({ username: 'maya', email: 'maya@test.dev' });
    const workspaces = await api.get('/api/v1/workspaces').set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(workspaces.body.workspaces).toHaveLength(1);

    // Username and email both work for signing in afterwards.
    await api.post('/api/v1/auth/login').send({ identifier: 'maya', password: 'correct horse battery' }).expect(200);
    await api
      .post('/api/v1/auth/login')
      .send({ identifier: 'MAYA@test.dev', password: 'correct horse battery' })
      .expect(200);
  });

  it('locks the code after five wrong guesses', async () => {
    await register();
    const code = lastCodeFor('maya@test.dev');
    const wrong = code === '000000' ? '111111' : '000000';

    for (let i = 0; i < 4; i++) {
      await api.post('/api/v1/auth/verify-email').send({ email: 'maya@test.dev', code: wrong }).expect(400);
    }
    const fifth = await api.post('/api/v1/auth/verify-email').send({ email: 'maya@test.dev', code: wrong }).expect(400);
    expect(fifth.body.error.code).toBe('otp_locked');

    // Even the right code no longer works.
    const late = await api.post('/api/v1/auth/verify-email').send({ email: 'maya@test.dev', code }).expect(400);
    expect(late.body.error.code).toBe('otp_expired');
  });

  it('makes you wait a minute between resends', async () => {
    await register();
    const res = await api.post('/api/v1/auth/resend-verification').send({ email: 'maya@test.dev' }).expect(429);
    expect(res.body.error.code).toBe('otp_cooldown');
    expect(res.body.error.retryAfter).toBeGreaterThan(0);
  });

  it("doesn't reveal whether an email has an account", async () => {
    await api.post('/api/v1/auth/resend-verification').send({ email: 'nobody@test.dev' }).expect(200);
    await api.post('/api/v1/auth/forgot-password').send({ email: 'nobody@test.dev' }).expect(200);
    expect(sent).toHaveLength(0);
  });
});

describe('usernames', () => {
  it('rejects a taken username and suggests free ones', async () => {
    await register();
    const res = await register({ email: 'other@test.dev' }).expect(409);
    expect(res.body.error.code).toBe('username_taken');
    expect(res.body.error.suggestions.length).toBeGreaterThan(0);
    expect(res.body.error.suggestions).not.toContain('maya');
  });

  it('treats usernames case-insensitively', async () => {
    await register();
    await register({ username: 'MAYA', email: 'other@test.dev' }).expect(409);
  });

  it('reports availability while typing', async () => {
    await register();

    const taken = await api.get('/api/v1/auth/username-available').query({ username: 'maya', name: 'Maya Chen' });
    expect(taken.body).toMatchObject({ available: false, reason: 'That username is taken' });
    expect(taken.body.suggestions).toContain('maya.chen');

    const free = await api.get('/api/v1/auth/username-available').query({ username: 'maya.chen' });
    expect(free.body).toMatchObject({ available: true, suggestions: [] });

    const invalid = await api.get('/api/v1/auth/username-available').query({ username: 'a' });
    expect(invalid.body).toMatchObject({ available: false, reason: 'Use at least 3 characters' });
  });

  it('rejects weak passwords at sign-up', async () => {
    const res = await register({ password: 'maya1234' }).expect(400);
    expect(res.body.error).toMatchObject({ code: 'weak_password', message: "Don't include your username" });
  });
});

describe('password reset', () => {
  async function verifiedUser() {
    await register();
    const res = await api
      .post('/api/v1/auth/verify-email')
      .send({ email: 'maya@test.dev', code: lastCodeFor('maya@test.dev') });
    await OtpCodeModel.deleteMany({});
    return res.headers['set-cookie'];
  }

  it('resets the password with an emailed code and ends other sessions', async () => {
    const oldSessionCookie = await verifiedUser();

    await api.post('/api/v1/auth/forgot-password').send({ email: 'maya@test.dev' }).expect(200);
    const code = lastCodeFor('maya@test.dev');

    await api
      .post('/api/v1/auth/reset-password')
      .send({ email: 'maya@test.dev', code, password: 'a whole new passphrase' })
      .expect(200);

    await api.post('/api/v1/auth/login').send({ identifier: 'maya', password: 'correct horse battery' }).expect(401);
    await api.post('/api/v1/auth/login').send({ identifier: 'maya', password: 'a whole new passphrase' }).expect(200);
    await api.post('/api/v1/auth/refresh').set('Cookie', oldSessionCookie).expect(401);
  });

  it("doesn't use up the code when the new password is too weak", async () => {
    await verifiedUser();
    await api.post('/api/v1/auth/forgot-password').send({ email: 'maya@test.dev' });
    const code = lastCodeFor('maya@test.dev');

    await api
      .post('/api/v1/auth/reset-password')
      .send({ email: 'maya@test.dev', code, password: 'password' })
      .expect(400);
    await api
      .post('/api/v1/auth/reset-password')
      .send({ email: 'maya@test.dev', code, password: 'a whole new passphrase' })
      .expect(200);
  });
});
