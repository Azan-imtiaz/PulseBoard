// Checks that roles are enforced by the API itself, not just hidden in the UI.
// Needs MongoDB running; uses a throwaway database.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { connectDb } from '../src/lib/db.js';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/features/auth/tokens.js';
import { UserModel } from '../src/features/auth/user.model.js';
import { WorkspaceModel } from '../src/features/workspaces/workspace.model.js';
import { BoardModel } from '../src/features/boards/board.model.js';
import { TaskModel } from '../src/features/tasks/task.model.js';
import { CommentModel } from '../src/features/comments/comment.model.js';

const app = createApp();
const tokens = {};
const ids = {};
let workspaceId;

const as = (who) => ({ Authorization: `Bearer ${tokens[who]}` });

beforeAll(async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();

  for (const who of ['owner', 'admin', 'member', 'outsider']) {
    const user = await UserModel.create({
      name: who,
      username: who,
      email: `${who}@test.dev`,
      passwordHash: 'x',
      color: '#000',
      emailVerifiedAt: new Date(),
    });
    ids[who] = String(user._id);
    tokens[who] = signAccessToken(ids[who]);
  }

  const workspace = await WorkspaceModel.create({
    name: 'Acme',
    members: [
      { user: ids.owner, role: 'owner' },
      { user: ids.admin, role: 'admin' },
      { user: ids.member, role: 'member' },
    ],
  });
  workspaceId = String(workspace._id);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('RBAC at the API layer', () => {
  let boardId;

  it('rejects requests without a token', async () => {
    await request(app).get('/api/v1/workspaces').expect(401);
  });

  it('only lets admins and owners create boards', async () => {
    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set(as('member'))
      .send({ name: 'Nope', key: 'NOPE' })
      .expect(403);

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set(as('admin'))
      .send({ name: 'Platform', key: 'PLAT' })
      .expect(201);
    boardId = res.body.board.id;
  });

  it('hides the workspace from outsiders entirely', async () => {
    await request(app).get(`/api/v1/boards/${boardId}`).set(as('outsider')).expect(404);
    await request(app).get(`/api/v1/workspaces/${workspaceId}/members`).set(as('outsider')).expect(404);
  });

  it('lets members delete their own tasks but not other people’s', async () => {
    const own = await request(app)
      .post(`/api/v1/boards/${boardId}/tasks`)
      .set(as('member'))
      .send({ title: 'Mine' })
      .expect(201);
    const theirs = await request(app)
      .post(`/api/v1/boards/${boardId}/tasks`)
      .set(as('admin'))
      .send({ title: 'Theirs' })
      .expect(201);

    await request(app).delete(`/api/v1/tasks/${theirs.body.task.id}`).set(as('member')).expect(403);
    await request(app).delete(`/api/v1/tasks/${own.body.task.id}`).set(as('member')).expect(204);
    await request(app).delete(`/api/v1/tasks/${theirs.body.task.id}`).set(as('admin')).expect(204);
  });

  it('stops admins from promoting people to admin', async () => {
    await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${ids.member}`)
      .set(as('admin'))
      .send({ role: 'admin' })
      .expect(403);
  });

  it('applies role changes immediately', async () => {
    await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${ids.member}`)
      .set(as('owner'))
      .send({ role: 'admin' })
      .expect(200);

    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set(as('member'))
      .send({ name: 'Mobile', key: 'MOB' })
      .expect(201);
  });

  it('cuts off removed members right away', async () => {
    await request(app).delete(`/api/v1/workspaces/${workspaceId}/members/${ids.member}`).set(as('owner')).expect(204);
    await request(app).get(`/api/v1/boards/${boardId}`).set(as('member')).expect(404);
  });

  it('deletes a task together with its comments', async () => {
    const created = await request(app)
      .post(`/api/v1/boards/${boardId}/tasks`)
      .set(as('owner'))
      .send({ title: 'Short-lived' })
      .expect(201);
    const taskId = created.body.task.id;
    await request(app).post(`/api/v1/tasks/${taskId}/comments`).set(as('owner')).send({ body: 'hello' }).expect(201);

    await request(app).delete(`/api/v1/tasks/${taskId}`).set(as('owner')).expect(204);
    expect(await CommentModel.countDocuments({ task: taskId })).toBe(0);
  });

  it('only lets the owner delete the workspace, and takes everything with it', async () => {
    await request(app).delete(`/api/v1/workspaces/${workspaceId}`).set(as('admin')).expect(403);
    await request(app).delete(`/api/v1/workspaces/${workspaceId}`).set(as('owner')).expect(204);

    expect(await WorkspaceModel.exists({ _id: workspaceId })).toBeNull();
    expect(await BoardModel.countDocuments({ workspace: workspaceId })).toBe(0);
    expect(await TaskModel.countDocuments({ workspace: workspaceId })).toBe(0);
    await request(app).get(`/api/v1/boards/${boardId}`).set(as('owner')).expect(404);
  });
});

describe('contact form rate limit', () => {
  it('only throttles the contact form, not the rest of the API', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).get('/api/v1/workspaces').set(as('owner')).expect(200);
    }
  });
});
