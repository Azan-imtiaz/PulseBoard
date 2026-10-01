import { useRef } from 'react';
import { format } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dueLabel, dueTone } from '@/lib/format';

// Due dates are stored as 5pm local time on the chosen day, so "due today"
// still reads as today in the afternoon.
const toIso = (day) => new Date(`${day}T17:00`).toISOString();

export function DueDateInput({ value, onChange, done = false, bordered }) {
  const input = useRef(null);
  const tone = value ? dueTone(value, done) : null;

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => input.current?.showPicker()}
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm outline-none transition-colors hover:bg-hover',
          bordered && 'border border-line',
          !value && 'text-fg-muted',
          tone === 'overdue' && 'text-danger',
          tone === 'soon' && 'text-warn',
        )}
      >
        <CalendarDays className="size-3.5" />
        {value ? dueLabel(value) : 'Due date'}
      </button>
      {value && (
        <button
          type="button"
          aria-label="Clear due date"
          onClick={() => onChange(null)}
          className="absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full bg-fg text-canvas group-hover:flex"
        >
          <X className="size-2.5" />
        </button>
      )}
      <input
        ref={input}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        value={value ? format(new Date(value), 'yyyy-MM-dd') : ''}
        onChange={(e) => onChange(e.target.value ? toIso(e.target.value) : null)}
      />
    </span>
  );
}
