import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Which demo accounts exist on this server. Stays cached for the session.
export function useDemoInfo() {
  return useQuery({
    queryKey: ['demo'],
    queryFn: () => api('/demo'),
    staleTime: Infinity,
    retry: false,
  });
}

export const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', member: 'Member' };

// What each role can and can't do, shown on the persona cards.
export const ROLE_ABILITIES = {
  owner: [
    [true, 'Create, move and comment on tasks'],
    [true, 'Delete any task'],
    [true, 'Manage boards and every member'],
  ],
  admin: [
    [true, 'Create, move and comment on tasks'],
    [true, 'Delete any task'],
    [true, 'Manage boards and members below him'],
  ],
  member: [
    [true, 'Create, move and comment on tasks'],
    [false, "Delete other people's tasks"],
    [false, 'Manage boards or members'],
  ],
};
