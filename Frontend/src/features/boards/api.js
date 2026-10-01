import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const boardKey = (boardId) => ['board', boardId];

export function useBoard(boardId) {
  return useQuery({
    queryKey: boardKey(boardId),
    queryFn: () => api(`/boards/${boardId}`),
  });
}

// Applied both for our own optimistic updates and for events from other clients,
// so it must be idempotent.
export function upsertTask(queryClient, task) {
  queryClient.setQueryData(boardKey(task.boardId), (state) => {
    if (!state) return state;
    const exists = state.tasks.some((t) => t.id === task.id);
    return {
      ...state,
      tasks: exists ? state.tasks.map((t) => (t.id === task.id ? task : t)) : [...state.tasks, task],
    };
  });
}

// Keeps the board screen and the sidebar's board list in step after a rename,
// whether it came from us or from another client.
export function applyBoardSummary(queryClient, summary) {
  queryClient.setQueryData(boardKey(summary.id), (state) => state && { ...state, board: summary });
  queryClient.setQueryData(['boards', summary.workspaceId], (boards) =>
    boards?.map((b) => (b.id === summary.id ? summary : b)),
  );
}

export function useBoardSettings(boardId, workspaceId) {
  const queryClient = useQueryClient();
  return {
    update: useMutation({
      mutationFn: (input) => api(`/boards/${boardId}`, { method: 'PATCH', body: input }).then((r) => r.board),
      onSuccess: (summary) => applyBoardSummary(queryClient, summary),
    }),
    remove: useMutation({
      mutationFn: () => api(`/boards/${boardId}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: boardKey(boardId) });
        queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] });
      },
    }),
  };
}

export function removeTask(queryClient, boardId, taskId) {
  queryClient.setQueryData(
    boardKey(boardId),
    (state) => state && { ...state, tasks: state.tasks.filter((t) => t.id !== taskId) },
  );
}

export function useTaskMutations(boardId) {
  const queryClient = useQueryClient();
  const findTask = (id) => queryClient.getQueryData(boardKey(boardId))?.tasks.find((t) => t.id === id);

  const create = useMutation({
    mutationFn: (input) => api(`/boards/${boardId}/tasks`, { method: 'POST', body: input }).then((r) => r.task),
    onSuccess: (task) => upsertTask(queryClient, task),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => api(`/tasks/${id}`, { method: 'PATCH', body: patch }).then((r) => r.task),
    onSuccess: (task) => upsertTask(queryClient, task),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }) =>
      api(`/tasks/${id}/move`, { method: 'POST', body: { status, position } }).then((r) => r.task),
    onSuccess: (task) => upsertTask(queryClient, task),
  });

  const remove = useMutation({
    mutationFn: (id) => api(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: (_res, id) => removeTask(queryClient, boardId, id),
    onError: (err) => toast.error(err.message),
  });

  // Optimistic writes are applied synchronously so a dropped card lands immediately
  // instead of snapping back for a frame. On failure only that task is rolled back,
  // leaving any realtime updates that arrived meanwhile intact.
  function optimistically(id, changes) {
    const previous = findTask(id);
    if (previous) upsertTask(queryClient, { ...previous, ...changes });
    return (err) => {
      if (previous) upsertTask(queryClient, previous);
      toast.error(err.message);
    };
  }

  return {
    create,
    remove,
    update(id, patch) {
      const { dependsOn, ...fields } = patch;
      const onError = optimistically(id, { ...fields, ...(dependsOn && { dependsOn }) });
      updateMutation.mutate({ id, patch }, { onError });
    },
    move(id, status, position) {
      const onError = optimistically(id, { status, position });
      moveMutation.mutate({ id, status, position }, { onError });
    },
  };
}

export const POSITION_GAP = 1024;

export function positionBetween(before, after) {
  if (before === undefined && after === undefined) return POSITION_GAP;
  if (before === undefined) return after / 2;
  if (after === undefined) return before + POSITION_GAP;
  return (before + after) / 2;
}

export function endOfColumn(tasks, status) {
  const max = Math.max(0, ...tasks.filter((t) => t.status === status).map((t) => t.position));
  return max + POSITION_GAP;
}
