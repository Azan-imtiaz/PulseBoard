import { useState } from 'react';
import { useNavigate } from 'react-router';
import * as Popover from '@radix-ui/react-popover';
import { toast } from 'sonner';
import { Check, ChevronDown, ListChecks, Repeat } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/Avatar';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger, popoverClass } from '@/components/Menu';
import { useAuth, useCurrentUser } from '@/features/auth/AuthProvider';
import { useBoards, useWorkspace } from '@/features/workspaces/api';
import { ROLE_LABEL, useDemoInfo } from './api';
import { steps } from './steps';

const PROGRESS_KEY = 'pb-demo-steps';

function readProgress() {
  try {
    return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

// Shown across the top of the app for demo accounts: who you are, a role switcher
// and the guided checklist.
export function DemoBanner({ workspaceId, onOpenPalette }) {
  const me = useCurrentUser();
  const { enterDemo, logout } = useAuth();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: boards = [] } = useBoards(workspaceId);
  const { data: demo } = useDemoInfo();
  const navigate = useNavigate();
  const [done, setDone] = useState(readProgress);
  const [open, setOpen] = useState(false);

  const board = boards.find((b) => b.key === 'PLAT') ?? boards[0];
  const role = workspace?.role;

  function markDone(id) {
    setDone((current) => {
      const next = new Set(current).add(id);
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
      } catch {
        // Private mode: progress just won't be remembered.
      }
      return next;
    });
  }

  async function switchRole(next) {
    if (next === role) return;
    try {
      await enterDemo(next);
      navigate('/app');
      toast.success(`You're now ${demo?.personas.find((p) => p.role === next)?.name ?? 'signed in'}, ${ROLE_LABEL[next]}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function run(step) {
    markDone(step.id);
    setOpen(false);
    const { action } = step;
    if (action.palette) return onOpenPalette();
    if (action.role) return switchRole(action.role);
    if (action.board && board) {
      const query = new URLSearchParams(action.params ?? {}).toString();
      const url = `/w/${workspaceId}/b/${board.id}${query ? `?${query}` : ''}`;
      if (action.newTab) return void window.open(url, '_blank');
      navigate(url);
    }
  }

  async function signUp() {
    await logout();
    window.location.assign('/register');
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-accent/20 bg-accent-soft px-3 text-sm sm:px-5">
      <span className="rounded-sm bg-accent px-1.5 py-0.5 text-2xs font-semibold tracking-wide text-accent-fg uppercase">
        Demo
      </span>
      <span className="hidden min-w-0 truncate text-fg-muted md:inline">
        You're exploring as <span className="font-medium text-fg">{me.name}</span>
        {role && <> · {ROLE_LABEL[role]}</>}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger className="flex h-7 items-center gap-1.5 rounded-md px-2 text-fg outline-none hover:bg-surface/70 data-[state=open]:bg-surface/70">
            <ListChecks className="size-3.5 text-accent" />
            <span className="hidden sm:inline">Things to try</span>
            <span className="text-xs text-fg-muted tabular-nums">
              {Math.min(done.size, steps.length)}/{steps.length}
            </span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="end" sideOffset={6} className={cn(popoverClass, 'w-[min(380px,calc(100vw-1rem))] p-1.5')}>
              <div className="px-2.5 pt-2 pb-2">
                <p className="text-sm font-semibold">Take the tour</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300"
                    style={{ width: `${(Math.min(done.size, steps.length) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
              <ul>
                {steps.map((step) => {
                  const complete = done.has(step.id);
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => run(step)}
                        className="flex w-full gap-3 rounded-md px-2.5 py-2 text-left outline-none hover:bg-hover focus-visible:bg-hover"
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                            complete ? 'border-ok bg-ok text-white' : 'border-line-strong text-fg-faint',
                          )}
                        >
                          {complete ? <Check className="size-3" /> : <step.icon className="size-3" />}
                        </span>
                        <span className="min-w-0">
                          <span className={cn('block text-sm font-medium', complete && 'text-fg-muted')}>
                            {step.title}
                          </span>
                          <span className="block text-xs leading-5 text-fg-muted">{step.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {demo?.personas.length > 0 && (
          <Menu>
            <MenuTrigger className="flex h-7 items-center gap-1.5 rounded-md px-2 text-fg outline-none hover:bg-surface/70 data-[state=open]:bg-surface/70">
              <Repeat className="size-3.5 text-accent" />
              <span className="hidden sm:inline">Switch role</span>
              <ChevronDown className="size-3 text-fg-faint" />
            </MenuTrigger>
            <MenuContent align="end" className="w-64">
              <MenuLabel>See the board as</MenuLabel>
              {demo.personas.map((p) => (
                <MenuItem
                  key={p.role}
                  icon={<Avatar person={p} size={16} />}
                  hint={ROLE_LABEL[p.role]}
                  checked={p.username === me.username}
                  onSelect={() => switchRole(p.role)}
                >
                  {p.name}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        )}

        <button
          type="button"
          onClick={signUp}
          className="ml-1 hidden h-7 items-center rounded-md bg-accent px-2.5 text-xs font-medium text-accent-fg hover:bg-accent-hover sm:flex"
        >
          Create your own
        </button>
      </div>
    </div>
  );
}
