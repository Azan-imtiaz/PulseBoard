import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Plus, X } from 'lucide-react';
import { substringFilter } from '@/lib/format';
import { popoverClass } from '@/components/Menu';
import { StatusIcon } from './meta';

export function Dependencies({ task, tasks, onChange }) {
  const [open, setOpen] = useState(false);
  const dependencies = task.dependsOn.map((id) => tasks.find((t) => t.id === id)).filter((t) => !!t);
  const candidates = tasks.filter((t) => t.id !== task.id && !task.dependsOn.includes(t.id));

  return (
    <div className="flex flex-col items-start gap-0.5 pl-2">
      {dependencies.map((dep) => (
        <span key={dep.id} className="group flex h-7 max-w-full items-center gap-2 text-sm">
          <StatusIcon status={dep.status} />
          <span className="font-mono text-2xs text-fg-faint">{dep.key}</span>
          <span className="truncate">{dep.title}</span>
          <button
            type="button"
            aria-label={`Remove dependency on ${dep.key}`}
            onClick={() => onChange(task.dependsOn.filter((id) => id !== dep.id))}
            className="text-fg-faint opacity-0 group-hover:opacity-100 hover:text-fg"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 -ml-1.5 text-xs text-fg-faint outline-none hover:bg-hover hover:text-fg-muted">
          <Plus className="size-3" />
          {dependencies.length === 0 ? 'Add dependency' : 'Add'}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={4} className={`${popoverClass} w-80 p-0`}>
            <Command loop filter={substringFilter}>
              <Command.Input
                autoFocus
                placeholder="Find a task…"
                className="h-9 w-full border-b border-line bg-transparent px-3 text-sm outline-none"
              />
              <Command.List className="scroll-thin max-h-64 overflow-y-auto p-1">
                <Command.Empty className="px-2 py-6 text-center text-xs text-fg-faint">No matching tasks</Command.Empty>
                {candidates.map((candidate) => (
                  <Command.Item
                    key={candidate.id}
                    value={`${candidate.key} ${candidate.title}`}
                    onSelect={() => {
                      onChange([...task.dependsOn, candidate.id]);
                      setOpen(false);
                    }}
                    className="flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm data-[selected=true]:bg-hover"
                  >
                    <StatusIcon status={candidate.status} />
                    <span className="w-14 shrink-0 font-mono text-2xs text-fg-faint">{candidate.key}</span>
                    <span className="truncate">{candidate.title}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
