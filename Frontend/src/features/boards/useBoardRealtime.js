import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { applyBoardSummary, boardKey, removeTask, upsertTask } from './api';

export function useBoardRealtime(boardId) {
  const queryClient = useQueryClient();
  const [viewers, setViewers] = useState([]);
  const [connected, setConnected] = useState(true);
  // Set when the board stops being reachable while it's open: 'deleted', or
  // 'revoked' when we were removed from its workspace.
  const [gone, setGone] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const join = () => socket.emit('board:join', boardId);
    let connectedBefore = socket.connected;

    // After a reconnect we may have missed events, so resync the whole board.
    const onConnect = () => {
      setConnected(true);
      join();
      if (connectedBefore) queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
      connectedBefore = true;
    };
    const onDisconnect = () => setConnected(false);
    const onTask = (task) => upsertTask(queryClient, task);
    const onTaskDeleted = ({ id }) => removeTask(queryClient, boardId, id);
    const onPresence = (payload) => {
      if (payload.boardId === boardId) setViewers(payload.viewers);
    };
    const onBoardUpdated = (summary) => applyBoardSummary(queryClient, summary);
    const lose = (reason) => (payload) => {
      if (String(payload.id ?? payload.boardId) !== boardId) return;
      setGone((current) => current ?? reason);
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    };
    const onBoardDeleted = lose('deleted');
    const onAccessRevoked = lose('revoked');
    const onComment = (comment) => {
      queryClient.setQueryData(['comments', comment.taskId], (comments) =>
        comments && !comments.some((c) => c.id === comment.id) ? [...comments, comment] : comments,
      );
    };

    if (socket.connected) join();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('task:created', onTask);
    socket.on('task:updated', onTask);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('presence', onPresence);
    socket.on('comment:created', onComment);
    socket.on('board:updated', onBoardUpdated);
    socket.on('board:deleted', onBoardDeleted);
    socket.on('board:access-revoked', onAccessRevoked);

    return () => {
      socket.emit('board:leave');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('task:created', onTask);
      socket.off('task:updated', onTask);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('presence', onPresence);
      socket.off('comment:created', onComment);
      socket.off('board:updated', onBoardUpdated);
      socket.off('board:deleted', onBoardDeleted);
      socket.off('board:access-revoked', onAccessRevoked);
      setViewers([]);
      setGone(null);
    };
  }, [boardId, queryClient]);

  return { viewers, connected, gone };
}
