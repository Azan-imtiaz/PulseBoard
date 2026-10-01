import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { inputClass } from '@/components/Input';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/Menu';
import { ErrorState } from '@/components/States';
import { useCurrentUser } from '@/features/auth/AuthProvider';
import { PageHeader } from '@/components/PageHeader';
import { useMemberMutations, useMembers, useWorkspace } from './api';
import { canAssignRole, canManage, isAdmin } from './permissions';

const roleCopy = {
  owner: 'Everything, including deleting the workspace',
  admin: 'Manage boards and members',
  member: 'Create and work on tasks',
};

export function MembersPage() {
  const { workspaceId = '' } = useParams();
  const { data: workspace } = useWorkspace(workspaceId);
  const members = useMembers(workspaceId);
  const me = useCurrentUser();
  const navigate = useNavigate();
  const mutations = useMemberMutations(workspaceId);
  const myRole = workspace?.role ?? 'member';

  const onError = (err) => toast.error(err.message);

  function changeRole(userId, role) {
    mutations.changeRole.mutate({ userId, role }, { onError, onSuccess: () => toast.success('Role updated') });
  }

  function remove(userId) {
    const leaving = userId === me.id;
    mutations.remove.mutate(userId, {
      onError,
      onSuccess: () => (leaving ? navigate('/app') : toast.success('Member removed')),
    });
  }

  return (
    <>
      <PageHeader crumbs={[workspace?.name, 'Members']} />
      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          <h1 className="text-xl font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Everyone here can see every board in {workspace?.name ?? 'this workspace'}.
          </p>

          {isAdmin(myRole) && <AddMemberForm workspaceId={workspaceId} myRole={myRole} />}

          {members.isError && <ErrorState error={members.error} onRetry={() => members.refetch()} />}

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {members.isPending &&
              [0, 1, 2].map((i) => (
                <li key={i} className="flex h-14 items-center gap-3">
                  <div className="skeleton size-7 rounded-full" />
                  <div className="skeleton h-4 w-40" />
                </li>
              ))}

            {members.data?.map((member) => {
              const manageable = canManage(myRole, member.role);
              const isMe = member.id === me.id;
              return (
                <li key={member.id} className="flex h-14 items-center gap-3">
                  <Avatar person={member} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                      {isMe && <span className="ml-1.5 font-normal text-fg-faint">you</span>}
                    </p>
                    <p className="truncate text-xs text-fg-muted">
                      @{member.username} · {member.email}
                    </p>
                  </div>
                  <span className="hidden text-xs text-fg-faint sm:block">
                    Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                  </span>

                  {manageable ? (
                    <Menu>
                      <MenuTrigger className="flex h-7 w-24 items-center justify-between rounded-md px-2 text-sm capitalize outline-none hover:bg-hover data-[state=open]:bg-hover">
                        {member.role}
                        <ChevronDown className="size-3.5 text-fg-faint" />
                      </MenuTrigger>
                      <MenuContent align="end" className="w-72">
                        {['admin', 'member'].map((role) => (
                          <MenuItem
                            key={role}
                            checked={member.role === role}
                            disabled={!canAssignRole(myRole, role)}
                            onSelect={() => role !== member.role && changeRole(member.id, role)}
                          >
                            <span className="block capitalize">{role}</span>
                            <span className="block text-xs text-fg-faint">{roleCopy[role]}</span>
                          </MenuItem>
                        ))}
                      </MenuContent>
                    </Menu>
                  ) : (
                    <span className="w-24 px-2 text-sm text-fg-muted capitalize">{member.role}</span>
                  )}

                  {manageable || (isMe && member.role !== 'owner') ? (
                    <Menu>
                      <MenuTrigger asChild>
                        <IconButton label="Member actions">
                          <MoreHorizontal className="size-4" />
                        </IconButton>
                      </MenuTrigger>
                      <MenuContent align="end">
                        <MenuItem destructive onSelect={() => remove(member.id)}>
                          {isMe ? 'Leave workspace' : 'Remove from workspace'}
                        </MenuItem>
                      </MenuContent>
                    </Menu>
                  ) : (
                    <span className="w-7" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

function AddMemberForm({ workspaceId, myRole }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const { add } = useMemberMutations(workspaceId);

  function onSubmit(event) {
    event.preventDefault();
    add.mutate(
      { email, role },
      {
        onSuccess: () => {
          toast.success(`Added ${email}`);
          setEmail('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex gap-2">
      <input
        type="email"
        required
        placeholder="teammate@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(inputClass, 'flex-1')}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} className={cn(inputClass, 'w-28 shrink-0')}>
        <option value="member">Member</option>
        <option value="admin" disabled={!canAssignRole(myRole, 'admin')}>
          Admin
        </option>
      </select>
      <Button type="submit" variant="primary" loading={add.isPending}>
        Add member
      </Button>
    </form>
  );
}
