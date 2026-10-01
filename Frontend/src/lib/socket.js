import { io } from 'socket.io-client';
import { getAccessToken, refreshSession } from './api';

let socket = null;

export function getSocket() {
  if (socket) return socket;

  socket = io({
    // Read the token at (re)connect time so reconnects use a fresh one.
    auth: (cb) => cb({ token: getAccessToken() }),
    // WebSocket only: no long-polling means no sticky sessions needed at the load balancer.
    transports: ['websocket'],
  });

  socket.on('connect_error', async (err) => {
    if (err.message !== 'unauthorized') return;
    if (await refreshSession()) socket?.connect();
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
