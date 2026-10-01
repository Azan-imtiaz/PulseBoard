import { cn } from '@/lib/cn';

export const STATUS_LABEL = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  in_review: 'In Review',
  done: 'Done',
};

export const PRIORITY_LABEL = {
  none: 'No priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'];

// Small hand-drawn glyphs: status reads as progress around a ring.
export function StatusIcon({ status, className }) {
  const base = cn('size-3.5 shrink-0', className);
  switch (status) {
    case 'backlog':
      return (
        <svg viewBox="0 0 14 14" className={cn(base, 'text-fg-faint')} aria-hidden>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 1.9" />
        </svg>
      );
    case 'todo':
      return (
        <svg viewBox="0 0 14 14" className={cn(base, 'text-fg-muted')} aria-hidden>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg viewBox="0 0 14 14" className={cn(base, 'text-warn')} aria-hidden>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3.5A3.5 3.5 0 0 1 7 10.5Z" fill="currentColor" />
        </svg>
      );
    case 'blocked':
      return (
        <svg viewBox="0 0 14 14" className={cn(base, 'text-danger')} aria-hidden>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.4 10.6 10.6 3.4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'in_review':
      return (
        <svg viewBox="0 0 14 14" className={cn(base, 'text-accent')} aria-hidden>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3.5A3.5 3.5 0 1 1 3.5 7H7Z" fill="currentColor" />
        </svg>
      );
    case 'done':
      return (
        <svg viewBox="0 0 14 14" className={cn(base, 'text-ok')} aria-hidden>
          <circle cx="7" cy="7" r="6.25" fill="currentColor" />
          <path
            d="m4.4 7.2 1.8 1.8 3.5-3.7"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function PriorityIcon({ priority, className }) {
  const base = cn('size-3.5 shrink-0', className);

  if (priority === 'urgent') {
    return (
      <svg viewBox="0 0 14 14" className={cn(base, 'text-danger')} aria-hidden>
        <rect x="1" y="1" width="12" height="12" rx="3" fill="currentColor" />
        <path d="M7 3.8v3.8" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7" cy="10" r="0.95" fill="var(--surface)" />
      </svg>
    );
  }
  if (priority === 'none') {
    return (
      <svg viewBox="0 0 14 14" className={cn(base, 'text-fg-faint')} aria-hidden>
        {[3, 7, 11].map((x) => (
          <rect key={x} x={x - 1} y="6.25" width="2" height="1.5" rx="0.5" fill="currentColor" />
        ))}
      </svg>
    );
  }

  const filled = { low: 1, medium: 2, high: 3 }[priority];
  return (
    <svg viewBox="0 0 14 14" className={cn(base, 'text-fg-muted')} aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 4}
          y={9 - i * 3.5}
          width="3"
          height={3.5 + i * 3.5}
          rx="0.75"
          fill="currentColor"
          fillOpacity={i < filled ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}
