import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { labelColor } from '@/features/boards/TaskCard';

export function LabelsEditor({ labels, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  function commit() {
    const label = draft.trim().toLowerCase();
    if (label && !labels.includes(label)) onChange([...labels, label]);
    setDraft('');
    setAdding(false);
  }

  return (
    <div className="flex min-h-7 flex-wrap items-center gap-1 pl-2">
      {labels.map((label) => (
        <span
          key={label}
          className="group inline-flex h-6 items-center gap-1.5 rounded-md border border-line pr-1 pl-2 text-xs text-fg-muted"
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: labelColor(label) }} />
          {label}
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={() => onChange(labels.filter((l) => l !== label))}
            className="rounded-sm text-fg-faint opacity-0 group-hover:opacity-100 hover:text-fg"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          maxLength={30}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              e.stopPropagation();
              setDraft('');
              setAdding(false);
            }
          }}
          className="h-6 w-24 rounded-md border border-accent bg-surface px-1.5 text-xs outline-none"
          placeholder="label"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-fg-faint hover:bg-hover hover:text-fg-muted"
        >
          <Plus className="size-3" />
          {labels.length === 0 && 'Add label'}
        </button>
      )}
    </div>
  );
}
