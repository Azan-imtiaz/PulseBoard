import { Server } from 'socket.io';
import { z } from 'zod';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { verifyAccessToken } from '../features/auth/tokens.js';
import { UserModel } from '../features/auth/user.model.js';
import { authorizeBoard } from '../features/boards/access.js';
import { boardRoom, broadcastPresence, setIo } from './emit.js';

const cursorSchema = z.object({ x: z.number().finite(), y: z.number().finite() });

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.CLIENT_ORIGIN, credentials: true },
  });

  io.use(async (socket, next) => {
    const userId = verifyAccessToken(String(socket.handshake.auth?.token ?? ''));
    if (!userId) return next(new Error('unauthorized'));

    const user = await UserModel.findById(userId).lean();
    if (!user) return next(new Error('unauthorized'));

    socket.data.user = { id: userId, name: user.name, color: user.color, avatarUrl: user.avatarUrl ?? null };
    socket.data.boardId = null;
    next();
  });

  io.on('connection', (socket) => {
    socket.on('board:join', async (boardId, ack) => {
      try {
        await authorizeBoard(socket.data.user.id, String(boardId), 'workspace:read');
      } catch {
        ack?.({ ok: false, error: 'Board not found' });
        return;
      }

      await leaveBoard(socket);
      socket.data.boardId = String(boardId);
      await socket.join(boardRoom(socket.data.boardId));
      await broadcastPresence(socket.data.boardId);
      ack?.({ ok: true });
    });

    socket.on('board:leave', () => leaveBoard(socket));

    // Cursor positions are fire-and-forget: volatile, so a slow client drops frames
    // instead of buffering a backlog of stale positions.
    socket.on('cursor:move', (position) => {
      const parsed = cursorSchema.safeParse(position);
      if (!socket.data.boardId || !parsed.success) return;
      socket.volatile
        .to(boardRoom(socket.data.boardId))
        .emit('cursor:move', { user: socket.data.user, ...parsed.data });
    });

    socket.on('cursor:leave', () => {
      if (socket.data.boardId)
        socket.to(boardRoom(socket.data.boardId)).emit('cursor:leave', { userId: socket.data.user.id });
    });

    socket.on('disconnect', () => {
      const boardId = socket.data.boardId;
      if (!boardId) return;
      socket.to(boardRoom(boardId)).emit('cursor:leave', { userId: socket.data.user.id });
      broadcastPresence(boardId).catch((err) => logger.warn({ err }, 'presence broadcast failed'));
    });
  });

  setIo(io);
  return io;
}

async function leaveBoard(socket) {
  const boardId = socket.data.boardId;
  if (!boardId) return;
  socket.data.boardId = null;
  socket.to(boardRoom(boardId)).emit('cursor:leave', { userId: socket.data.user.id });
  await socket.leave(boardRoom(boardId));
  await broadcastPresence(boardId);
}
