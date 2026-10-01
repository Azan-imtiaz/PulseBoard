import { Check, FileText, Mail, Search, X } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Kbd } from '@/components/Kbd';
import { StatusIcon } from '@/features/tasks/meta';

// Small static slices of the real interface, used to illustrate each feature on
// the home page instead of generic icons.

const maya = { name: 'Maya Chen', color: '#F76B15' };
const priya = { name: 'Priya Raman', color: '#8E4EC6' };
const daniel = { name: 'Daniel Okafor', color: '#0090FF' };

export function PresenceVisual() {
  return (
    <div className="relative h-full min-h-40">
      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1">
        <div className="flex">
          {[maya, priya, daniel].map((p) => (
            <span key={p.name} className="-ml-1.5 rounded-full ring-2 ring-surface first:ml-0">
              <Avatar person={p} size={22} />
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-fg-muted">
          <span className="size-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-ok" />3 viewing
        </span>
      </div>
      <MiniCursor person={priya} className="top-20 left-[38%]" />
      <MiniCursor person={daniel} className="top-28 left-[12%]" />
      <div className="absolute right-4 bottom-4 w-44 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
        <span className="font-medium">Priya</span> <span className="text-fg-muted">moved PLAT-3 to In Review</span>
      </div>
    </div>
  );
}

function MiniCursor({ person, className }) {
  return (
    <div className={`absolute ${className}`}>
      <svg width="14" height="16" viewBox="0 0 16 18">
        <path d="M1 1l5.2 15 2.3-6.2L14.8 7.6z" fill={person.color} stroke="white" strokeWidth="1.2" />
      </svg>
      <span
        className="-mt-0.5 ml-3 block rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
        style={{ backgroundColor: person.color }}
      >
        {person.name.split(' ')[0]}
      </span>
    </div>
  );
}

export function WorkflowVisual() {
  return (
    <div className="flex h-full min-h-40 flex-col justify-between gap-3 p-4">
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {['todo', 'in_progress', 'done'].map((status) => (
          <div
            key={status}
            className={`flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5 ${status === 'done' ? 'opacity-40' : ''}`}
          >
            <StatusIcon status={status} className="size-3" />
            {status === 'done' ? "Can't move here" : status === 'todo' ? 'Todo' : 'In Progress'}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 self-start rounded-lg bg-surface px-3 py-2 text-xs shadow-pop">
        <span className="flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
          !
        </span>
        Assign someone before starting this task
      </div>
    </div>
  );
}

export function ReportVisual() {
  const weeks = [2, 2, 3, 2, 4, 5];
  return (
    <div className="flex h-full min-h-40 flex-col justify-end gap-3 p-4">
      <div className="flex h-20 items-end gap-1.5">
        {weeks.map((n, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${i === weeks.length - 1 ? 'bg-accent' : 'bg-line-strong'}`}
            style={{ height: `${(n / 5) * 100}%` }}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-11/12 rounded-full bg-line" />
        <div className="h-2 w-3/4 rounded-full bg-line" />
      </div>
    </div>
  );
}

export function PaletteVisual() {
  return (
    <div className="flex h-full min-h-40 items-center justify-center p-4">
      <div className="w-full max-w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs text-fg-muted">
          <Search className="size-3" />
          webhook
          <span className="ml-auto flex gap-0.5">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </div>
        <div className="p-1 text-xs">
          <div className="flex items-center gap-2 rounded-md bg-hover px-2 py-1.5">
            <StatusIcon status="in_review" className="size-3" />
            <span className="font-mono text-[10px] text-fg-faint">PLAT-3</span>
            Webhook retries
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-fg-muted">
            <StatusIcon status="todo" className="size-3" />
            New task
            <Kbd className="ml-auto">C</Kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RolesVisual() {
  const rows = [
    ['Owner', true, true],
    ['Admin', true, true],
    ['Member', true, false],
  ];
  return (
    <div className="p-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-fg-faint">
            <th className="pb-2 font-normal" />
            <th className="pb-2 font-normal">Work on tasks</th>
            <th className="pb-2 font-normal">Manage boards</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([role, tasks, boards]) => (
            <tr key={role} className="border-t border-line">
              <td className="py-2 font-medium">{role}</td>
              {[tasks, boards].map((allowed, i) => (
                <td key={i} className="py-2">
                  {allowed ? <Check className="size-3.5 text-ok" /> : <X className="size-3.5 text-fg-faint" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SignInVisual() {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 p-4">
      <div className="flex gap-1.5">
        {'482913'.split('').map((digit, i) => (
          <span
            key={i}
            className="flex size-8 items-center justify-center rounded-md border border-line bg-surface font-mono text-sm font-medium"
          >
            {digit}
          </span>
        ))}
      </div>
      <span className="flex items-center gap-1.5 text-xs text-ok">
        <Check className="size-3.5" /> Email confirmed
      </span>
    </div>
  );
}

export function NotificationsVisual() {
  return (
    <div className="flex h-full min-h-40 flex-col justify-center gap-2.5 p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs">
        <FileText className="size-4 shrink-0 text-fg-faint" />
        <span className="flex-1 truncate">retry-policy-draft.pdf</span>
        <span className="text-fg-faint">412 KB</span>
      </div>
      <div className="flex flex-1 items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs">
        <Mail className="mt-px size-4 shrink-0 text-fg-faint" />
        <span>
          <span className="block font-medium">[PLAT-3] Daniel Okafor mentioned you</span>
          <span className="text-fg-muted">"@priya can you review the retry limits?"</span>
        </span>
      </div>
    </div>
  );
}
