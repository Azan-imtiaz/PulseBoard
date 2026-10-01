let io = null;

export function setIo(server) {
  io = server;
}

export const boardRoom = (boardId) => `board:${boardId}`;

// Services call this after a successful write to push it to everyone viewing the
// board. It's a no-op when no socket server is running (the seed script, tests).
export function emitToBoard(boardId, event, payload) {
  io?.to(boardRoom(boardId)).emit(event, payload);
}

// Presence is derived from the room itself: whoever's sockets are in it right now.
// There's no separate presence list to fall out of sync.
export async function viewersOf(boardId) {
  const sockets = await io.in(boardRoom(boardId)).fetchSockets();
  const viewers = new Map();
  for (const s of sockets) {
    viewers.set(s.data.user.id, s.data.user);
  }
  return [...viewers.values()];
}

export async function broadcastPresence(boardId) {
  const viewers = await viewersOf(boardId);
  io.to(boardRoom(boardId)).emit('presence', { boardId, viewers });
}

// Board access is checked when a socket joins a room, so losing access later
// (removed from the workspace, board or workspace deleted) has to push sockets out
// explicitly. Pass a userId to evict one person; omit it to empty the rooms.
export async function evictFromBoards(boardIds, userId) {
  if (!io) return;
  for (const boardId of boardIds.map(String)) {
    const room = boardRoom(boardId);
    const sockets = await io.in(room).fetchSockets();
    const evicted = sockets.filter((s) => !userId || s.data.user.id === userId);
    if (!evicted.length) continue;

    for (const s of evicted) {
      s.data.boardId = null;
      s.leave(room);
      s.emit('board:access-revoked', { boardId });
    }
    if (userId) {
      io.to(room).emit('cursor:leave', { userId });
      await broadcastPresence(boardId);
    }
  }
}
