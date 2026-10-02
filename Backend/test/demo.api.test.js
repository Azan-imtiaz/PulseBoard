// The public demo: one-click sign-in per role, and the guards that keep the shared
// workspace intact for the next visitor. Needs MongoDB.

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

const sent = vi.hoisted(() => []);
vi.mock('../src/services/email.js', () => ({
  sendEmail: async (email) => void sent.push(email),
}));

const { connectDb } = await import('../src/lib/db.js');
const { createApp } = await import('../src/app.js');
const { resetDemo } = await import('../src/features/demo/resetDemo.js');
const { UserModel } = await import('../src/features/auth/user.model.js');
const { TaskModel } = await import('../src/features/tasks/task.model.js');

const api = request(createApp());
let workspaceId;
let boardId;

async function signIn(role) {
  const res = await api.post('/api/v1/demo/sign-in').send({ role }).expect(200);
  return { Authorization: `Bearer ${res.body.accessToken}` };
}

beforeAll(async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('demo mode', () => {
  it('reports the demo as unavailable until it has been seeded', async () => {
    const res = await api.get('/api/v1/demo').expect(200);
    expect(res.body).toEqual({ available: false, personas: [] });
    await api.post('/api/v1/demo/sign-in').send({ role: 'owner' }).expect(404);
  });

  it('signs visitors in as any of the three roles', async () => {
    const { workspace } = await resetDemo();
    workspaceId = String(workspace._id);

    const info = await api.get('/api/v1/demo').expect(200);
    expect(info.body.available).toBe(true);
    expect(info.body.personas.map((p) => p.role)).toEqual(['owner', 'admin', 'member']);

    const res = await api.post('/api/v1/demo/sign-in').send({ role: 'member' }).expect(200);
    expect(res.body.user).toMatchObject({ username: 'hira', isDemo: true });
    expect(res.headers['set-cookie'][0]).toMatch(/pb_refresh=/);

    const owner = await signIn('owner');
    const boards = await api.get(`/api/v1/workspaces/${workspaceId}/boards`).set(owner);
    boardId = boards.body.boards.find((b) => b.key === 'PLAT').id;
  });

  it('lets visitors work on tasks', async () => {
    const owner = await signIn('owner');
    const created = await api
      .post(`/api/v1/boards/${boardId}/tasks`)
      .set(owner)
      .send({ title: 'Try it out' })
      .expect(201);
    await api.post(`/api/v1/tasks/${created.body.task.id}/comments`).set(owner).send({ body: 'Hello @azan' }).expect(201);
    // Tasks a visitor added can be cleaned up again.
    await api.delete(`/api/v1/tasks/${created.body.task.id}`).set(owner).expect(204);
  });

  it('locks changes that would spoil the demo for the next visitor', async () => {
    const owner = await signIn('owner');
    const seeded = await TaskModel.findOne({ board: boardId, number: 1 });
    const azan = await UserModel.findOne({ username: 'azan' });

    // Built lazily: supertest starts a request as soon as it's created.
    const locked = [
      () => api.delete(`/api/v1/workspaces/${workspaceId}`),
      () => api.patch(`/api/v1/workspaces/${workspaceId}`).send({ name: 'Renamed' }),
      () => api.delete(`/api/v1/workspaces/${workspaceId}/members/${azan._id}`),
      () => api.patch(`/api/v1/workspaces/${workspaceId}/members/${azan._id}`).send({ role: 'member' }),
      () => api.post(`/api/v1/workspaces/${workspaceId}/members`).send({ email: 'someone@example.com' }),
      () => api.post(`/api/v1/workspaces/${workspaceId}/boards`).send({ name: 'Junk', key: 'JUNK' }),
      () => api.delete(`/api/v1/boards/${boardId}`),
      () => api.delete(`/api/v1/tasks/${seeded._id}`),
      () =>
        api
          .post(`/api/v1/tasks/${seeded._id}/attachments/upload-url`)
          .send({ name: 'a.txt', contentType: 'text/plain', size: 1 }),
    ];
    for (const send of locked) {
      const res = await send().set(owner).expect(403);
      expect(res.body.error.code).toBe('demo_locked');
    }
  });

  it('never emails demo accounts', async () => {
    await api.post('/api/v1/auth/forgot-password').send({ email: 'ayesha@margallalabs.dev' }).expect(200);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sent).toHaveLength(0);
  });

  it('resets without changing account ids, so signed-in visitors stay signed in', async () => {
    const before = await UserModel.findOne({ username: 'ayesha' });
    const owner = await signIn('owner');
    await resetDemo();
    const after = await UserModel.findOne({ username: 'ayesha' });

    expect(String(after._id)).toBe(String(before._id));
    const workspaces = await api.get('/api/v1/workspaces').set(owner).expect(200);
    expect(workspaces.body.workspaces).toHaveLength(1);
  });

  it('removes demo accounts that are no longer part of the demo', async () => {
    await UserModel.create({
      name: 'Old Teammate',
      username: 'old.teammate',
      email: 'old@margallalabs.dev',
      passwordHash: 'x',
      color: '#000',
      isDemo: true,
    });
    await resetDemo();
    expect(await UserModel.exists({ username: 'old.teammate' })).toBeNull();
    expect(await UserModel.countDocuments({ isDemo: true })).toBe(6);
  });

  it('refuses to take over a real account that uses a demo username', async () => {
    await UserModel.updateOne({ username: 'zain' }, { isDemo: false });
    await expect(resetDemo()).rejects.toThrow(/real account/);
  });
});
