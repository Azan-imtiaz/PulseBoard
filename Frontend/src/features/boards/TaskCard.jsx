import { forwardRef, memo } from 'react';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dueLabel, dueTone } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { PriorityIcon } from '@/features/tasks/meta';

export const TaskCard = memo(
  forwardRef(function TaskCard({ task, assignee, dragging, className, ...props }, ref) {
    const tone = task.dueDate ? dueTone(task.dueDate, task.status === 'done') : null;
    const hasMeta = task.priority !== 'none' || task.dueDate || task.labels.length > 0 || task.attachments.length > 0;

    return (
      <div
        ref={ref}
        className={cn(
          'group rounded-lg border border-line bg-surface px-3 py-2.5 text-left outline-none',
          'transition-[border-color,opacity] duration-100 hover:border-line-strong focus-visible:border-accent',
          dragging && 'opacity-30',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-2xs text-fg-faint">{task.key}</span>
          {assignee && <Avatar person={assignee} size={18} />}
        </div>

        <p className={cn('mt-1 line-clamp-2 text-sm leading-5 text-fg', task.status === 'done' && 'text-fg-muted')}>
          {task.title}
        </p>

        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {task.priority !== 'none' && (
              <span className="flex h-5 items-center rounded-sm border border-line px-1" title={task.priority}>
                <PriorityIcon priority={task.priority} className="size-3" />
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  'flex h-5 items-center rounded-sm border border-line px-1.5 text-2xs',
                  tone === 'overdue' && 'border-danger/30 text-danger',
                  tone === 'soon' && 'text-warn',
                  tone === 'normal' && 'text-fg-muted',
                )}
              >
                {dueLabel(task.dueDate)}
              </span>
            )}
            {task.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="flex h-5 items-center gap-1 rounded-sm border border-line px-1.5 text-2xs text-fg-muted"
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: labelColor(label) }} />
                {label}
              </span>
            ))}
            {task.attachments.length > 0 && (
              <span className="flex h-5 items-center gap-0.5 text-2xs text-fg-faint">
                <Paperclip className="size-3" />
                {task.attachments.length}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }),
);

const LABEL_COLORS = ['#e5484d', '#f76b15', '#ffb224', '#46a758', '#12a594', '#0090ff', '#8e4ec6', '#d6409f'];

export function labelColor(label) {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LABEL_COLORS[hash % LABEL_COLORS.length];
}
