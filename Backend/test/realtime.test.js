// Runs a real Socket.io server with real clients connected to it. User lookups
// and board permissions are stubbed, so no database is needed.

import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { io as connect } from 'socket.io-client';
import { signAccessToken } from '../src/features/auth/tokens.js';
import { createSocketServer } from '../src/realtime/socket.js';
import { emitToBoard, evictFromBoards } from '../src/realtime/emit.js';

const users = {
  aaaaaaaaaaaaaaaaaaaaaaaa: { name: 'Ada', color: '#0090FF' },
  bbbbbbbbbbbbbbbbbbbbbbbb: { name: 'Bo', color: '#E5484D' },
  cccccccccccccccccccccccc: { name: 'Cy', color: '#46A758' },
};

vi.mock('../src/features/auth/user.model.js', () => ({
  UserModel: { findById: (id) => ({ lean: async () => users[id] ?? null }) },
}));

// Cy isn't a member of the board's workspace.
vi.mock('../src/features/boards/access.js', () => ({
  authorizeBoard: async (userId) => {
    if (userId === 'cccccccccccccccccccccccc') throw new Error('not found');
    return { board: {}, role: 'member' };
  },
}));

const BOARD = 'board-1';
const clients = [];
let server;
let port;

async function join(userId, boardId = BOARD) {
  const socket = connect(`http://localhost:${port}`, {
    auth: { token: signAccessToken(userId) },
    transports: ['websocket'],
  });
  clients.push(socket);
  const result = await socket.emitWithAck('board:join', boardId);
  return { socket, result };
}

function next(socket, event, match = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), 2000);
    const handler = (payload) => {
      if (!match(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });
}

beforeAll(async () => {
  const http = createServer();
  server = createSocketServer(http);
  await new Promise((resolve) => http.listen(0, resolve));
  port = http.address().port;
});

afterAll(async () => {
  clients.forEach((c) => c.disconnect());
  server.close();
});

describe('realtime board events', () => {
  let ada;
  let bo;

  it('shows everyone viewing the board in presence', async () => {
    ({ socket: ada } = await join('aaaaaaaaaaaaaaaaaaaaaaaa'));
    const presence = next(ada, 'presence', (p) => p.viewers.length === 2);
    ({ socket: bo } = await join('bbbbbbbbbbbbbbbbbbbbbbbb'));

    const { viewers } = await presence;
    expect(viewers.map((v) => v.name).sort()).toEqual(['Ada', 'Bo']);
  });

  it('delivers board events to everyone viewing the board', async () => {
    const onAda = next(ada, 'task:updated');
    const onBo = next(bo, 'task:updated');
    emitToBoard(BOARD, 'task:updated', { id: 'task-1' });

    expect(await onAda).toEqual({ id: 'task-1' });
    expect(await onBo).toEqual({ id: 'task-1' });
  });

  it('relays cursors to other viewers but not back to the sender', async () => {
    const echoed = vi.fn();
    ada.on('cursor:move', echoed);
    const onBo = next(bo, 'cursor:move');

    ada.emit('cursor:move', { x: 120, y: 48 });

    const cursor = await onBo;
    expect(cursor).toMatchObject({ user: { name: 'Ada' }, x: 120, y: 48 });
    expect(echoed).not.toHaveBeenCalled();
    ada.off('cursor:move', echoed);
  });

  it('keeps non-members out of the room', async () => {
    const { socket: cy, result } = await join('cccccccccccccccccccccccc');
    expect(result).toEqual({ ok: false, error: 'Board not found' });

    const leaked = vi.fn();
    cy.on('task:updated', leaked);
    const delivered = next(ada, 'task:updated');
    emitToBoard(BOARD, 'task:updated', { id: 'task-2' });
    await delivered;
    expect(leaked).not.toHaveBeenCalled();
  });

  it('updates presence and clears the cursor when someone disconnects', async () => {
    const presence = next(ada, 'presence', (p) => p.viewers.length === 1);
    const cursorLeft = next(ada, 'cursor:leave');
    bo.disconnect();

    expect((await presence).viewers).toHaveLength(1);
    expect((await cursorLeft).userId).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
  });
});

describe('losing access', () => {
  it('pushes a removed member out of the room right away', async () => {
    const { socket: ada } = await join('aaaaaaaaaaaaaaaaaaaaaaaa');
    const { socket: bo } = await join('bbbbbbbbbbbbbbbbbbbbbbbb');

    const revoked = next(bo, 'board:access-revoked');
    const presence = next(ada, 'presence', (p) => p.viewers.every((v) => v.name !== 'Bo'));
    await evictFromBoards([BOARD], 'bbbbbbbbbbbbbbbbbbbbbbbb');

    expect(await revoked).toEqual({ boardId: BOARD });
    await presence;

    const leaked = vi.fn();
    bo.on('task:updated', leaked);
    const delivered = next(ada, 'task:updated');
    emitToBoard(BOARD, 'task:updated', { id: 'task-3' });
    await delivered;
    expect(leaked).not.toHaveBeenCalled();
  });
});

describe('socket auth', () => {
  it('rejects connections without a valid token', async () => {
    const socket = connect(`http://localhost:${port}`, { auth: { token: 'nope' }, transports: ['websocket'] });
    clients.push(socket);
    const error = await new Promise((resolve) => socket.on('connect_error', resolve));
    expect(error.message).toBe('unauthorized');
  });
});
