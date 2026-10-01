import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { BarChart3, BookOpen, FileCode2, LogOut, Mail, Moon, Plus, Sparkles, Sun, Users, LayoutGrid } from 'lucide-react';
import { setTheme } from '@/lib/theme';
import { substringFilter } from '@/lib/format';
import { Kbd } from '@/components/Kbd';
import { useAuth } from '@/features/auth/AuthProvider';
import { boardKey } from '@/features/boards/api';
import { openContactDialog } from '@/features/contact/store';
import { useBoards } from '@/features/workspaces/api';
import { StatusIcon } from '@/features/tasks/meta';

export function CommandPalette({ workspaceId, open, onOpenChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { data: boards = [] } = useBoards(workspaceId);
  const [search, setSearch] = useState('');

  // Tasks come from the board that's already loaded; no extra request while typing.
  const board = boardId ? queryClient.getQueryData(boardKey(boardId)) : undefined;
  const tasks = useMemo(() => (open ? (board?.tasks ?? []) : []), [open, board]);

  function run(action) {
    onOpenChange(false);
    setSearch('');
    action();
  }

  const openPanel = (key, value) => navigate(`${location.pathname}?${key}=${encodeURIComponent(value)}`);
  const dark = document.documentElement.classList.contains('dark');

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      loop
      filter={substringFilter}
      overlayClassName="fixed inset-0 z-40 bg-overlay"
      contentClassName="fixed top-[16vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[600px] -translate-x-1/2 overflow-hidden rounded-xl bg-surface shadow-pop outline-none data-[state=open]:animate-[dialog-in_160ms_var(--ease-out-quint)]"
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder={board ? `Search ${board.board.name} tasks, boards and actions…` : 'Search boards and actions…'}
        className="h-12 w-full border-b border-line bg-transparent px-4 text-base outline-none"
      />
      <Command.List className="scroll-thin max-h-[min(420px,60vh)] overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-faint">
        <Command.Empty className="py-10 text-center text-sm text-fg-muted">No results for “{search}”</Command.Empty>

        {board && (
          <Command.Group heading="Actions">
            <Item icon={<Plus />} onSelect={() => run(() => openPanel('new', 'backlog'))} shortcut="C">
              New task
            </Item>
            <Item icon={<BarChart3 />} onSelect={() => run(() => openPanel('report', '1'))}>
              Generate sprint report
            </Item>
            <Item icon={<Sparkles />} onSelect={() => run(() => openPanel('prioritize', '1'))}>
              Suggest priorities
            </Item>
          </Command.Group>
        )}

        {search && tasks.length > 0 && (
          <Command.Group heading={`Tasks in ${board?.board.name}`}>
            {tasks.map((task) => (
              <Command.Item
                key={task.id}
                value={`${task.key} ${task.title}`}
                onSelect={() => run(() => openPanel('task', task.key))}
                className={itemClass}
              >
                <StatusIcon status={task.status} />
                <span className="w-16 shrink-0 font-mono text-2xs text-fg-faint">{task.key}</span>
                <span className="truncate">{task.title}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Boards">
          {boards.map((b) => (
            <Command.Item
              key={b.id}
              value={`board ${b.key} ${b.name}`}
              onSelect={() => run(() => navigate(`/w/${workspaceId}/b/${b.id}`))}
              className={itemClass}
            >
              <LayoutGrid className="size-4 text-fg-muted" />
              <span className="truncate">{b.name}</span>
              <span className="ml-auto font-mono text-2xs text-fg-faint">{b.key}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="General">
          <Item icon={<Users />} onSelect={() => run(() => navigate(`/w/${workspaceId}/members`))}>
            Members
          </Item>
          <Item icon={<BookOpen />} onSelect={() => run(() => navigate('/guide'))}>
            Open the guide
          </Item>
          <Item icon={dark ? <Sun /> : <Moon />} onSelect={() => run(() => setTheme(dark ? 'light' : 'dark'))}>
            Switch to {dark ? 'light' : 'dark'} theme
          </Item>
          <Item icon={<FileCode2 />} onSelect={() => run(() => window.open('/docs', '_blank'))}>
            Open API reference
          </Item>
          <Item icon={<Mail />} onSelect={() => run(openContactDialog)}>
            Contact the team
          </Item>
          <Item icon={<LogOut />} onSelect={() => run(logout)}>
            Sign out
          </Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

const itemClass =
  'flex h-9 cursor-default items-center gap-2.5 rounded-md px-2 text-sm text-fg select-none data-[selected=true]:bg-hover';

function Item({ icon, children, onSelect, shortcut }) {
  return (
    <Command.Item onSelect={onSelect} className={itemClass}>
      <span className="flex size-4 items-center justify-center text-fg-muted [&>svg]:size-4">{icon}</span>
      <span className="flex-1">{children}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Command.Item>
  );
}
