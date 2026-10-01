import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api('/workspaces').then((r) => r.workspaces),
  });
}

export function useWorkspace(workspaceId) {
  const query = useWorkspaces();
  return { ...query, data: query.data?.find((w) => w.id === workspaceId) };
}

export function useBoards(workspaceId) {
  return useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => api(`/workspaces/${workspaceId}/boards`).then((r) => r.boards),
  });
}

export function useMembers(workspaceId) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => api(`/workspaces/${workspaceId}/members`).then((r) => r.members),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => api('/workspaces', { method: 'POST', body: { name } }).then((r) => r.workspace),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useCreateBoard(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      api(`/workspaces/${workspaceId}/boards`, { method: 'POST', body: input }).then((r) => r.board),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] }),
  });
}

export function useWorkspaceSettings(workspaceId) {
  const queryClient = useQueryClient();
  return {
    rename: useMutation({
      mutationFn: (name) => api(`/workspaces/${workspaceId}`, { method: 'PATCH', body: { name } }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
    }),
    remove: useMutation({
      mutationFn: () => api(`/workspaces/${workspaceId}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: ['boards', workspaceId] });
        queryClient.removeQueries({ queryKey: ['members', workspaceId] });
        return queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      },
    }),
  };
}

export function useMemberMutations(workspaceId) {
  const queryClient = useQueryClient();
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    queryClient.invalidateQueries({ queryKey: ['board'] });
  };

  return {
    add: useMutation({
      mutationFn: (input) => api(`/workspaces/${workspaceId}/members`, { method: 'POST', body: input }),
      onSuccess,
    }),
    changeRole: useMutation({
      mutationFn: ({ userId, role }) =>
        api(`/workspaces/${workspaceId}/members/${userId}`, { method: 'PATCH', body: { role } }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (userId) => api(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}
