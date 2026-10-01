import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Link2, MoreHorizontal, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button, IconButton } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/Menu';
import { EmptyState } from '@/components/States';
import { Tooltip } from '@/components/Tooltip';
import { useCurrentUser } from '@/features/auth/AuthProvider';
import { isAdmin } from '@/features/workspaces/permissions';
import { endOfColumn, useTaskMutations } from '@/features/boards/api';
import { AssigneePicker, PriorityPicker, StatusPicker } from './Pickers';
import { DueDateInput } from './DueDateInput';
import { LabelsEditor } from './LabelsEditor';
import { Dependencies } from './Dependencies';
import { Attachments } from './Attachments';
import { Comments } from './Comments';

export function TaskSheet({ state, task, missingKey, onClose }) {
  const open = !!task || !!missingKey;

  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay/40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          tabIndex={-1}
          // Focus the panel itself rather than its first button, so a tooltip doesn't
          // pop open and Escape closes the panel straight away.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            e.target.focus();
          }}
          className="fixed top-2 right-2 bottom-2 z-50 flex w-[min(600px,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl bg-surface shadow-pop outline-none data-[state=open]:animate-[sheet-in_260ms_var(--ease-out-quint)]"
        >
          {task ? (
            <TaskDetail key={task.id} state={state} task={task} onClose={onClose} />
          ) : (
            <>
              <RadixDialog.Title className="sr-only">Task not found</RadixDialog.Title>
              <EmptyState
                className="flex-1"
                title={`${missingKey} isn't here`}
                body="It may have been deleted, or it belongs to another board."
                action={<Button onClick={onClose}>Back to board</Button>}
              />
            </>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function TaskDetail({ state, task, onClose }) {
  const me = useCurrentUser();
  const { update, move, remove } = useTaskMutations(state.board.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const canDelete = isAdmin(state.role) || task.createdBy === me.id;

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success(`Copied link to ${task.key}`);
  }

  function deleteTask() {
    remove.mutate(task.id, {
      onSuccess: () => {
        toast.success(`Deleted ${task.key}`);
        onClose();
      },
    });
  }

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line pr-2 pl-5">
        <RadixDialog.Title className="font-mono text-xs text-fg-muted">{task.key}</RadixDialog.Title>
        <div className="ml-auto flex items-center">
          <Tooltip content="Copy link">
            <IconButton label="Copy link" onClick={copyLink}>
              <Link2 className="size-4" />
            </IconButton>
          </Tooltip>
          {canDelete && (
            <Menu>
              <MenuTrigger asChild>
                <IconButton label="More actions">
                  <MoreHorizontal className="size-4" />
                </IconButton>
              </MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  destructive
                  icon={<Trash2 className="size-3.5 text-danger" />}
                  onSelect={() => setConfirmingDelete(true)}
                >
                  Delete task
                </MenuItem>
              </MenuContent>
            </Menu>
          )}
          <RadixDialog.Close asChild>
            <IconButton label="Close">
              <X className="size-4" />
            </IconButton>
          </RadixDialog.Close>
        </div>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="px-6 pt-5 pb-2">
          <EditableText
            value={task.title}
            onSave={(title) => title && update(task.id, { title })}
            className="text-xl font-semibold tracking-tight"
            placeholder="Task title"
            singleLine
          />

          <dl className="mt-4 grid grid-cols-[96px_1fr] items-center gap-y-0.5 text-sm">
            <Property label="Status">
              <StatusPicker
                value={task.status}
                statuses={state.workflow.statuses}
                allowed={state.workflow.transitions[task.status]}
                onChange={(status) => move(task.id, status, endOfColumn(state.tasks, status))}
              />
            </Property>
            <Property label="Priority">
              <PriorityPicker value={task.priority} onChange={(priority) => update(task.id, { priority })} />
            </Property>
            <Property label="Assignee">
              <AssigneePicker
                value={task.assigneeId}
                members={state.members}
                onChange={(assigneeId) => update(task.id, { assigneeId })}
              />
            </Property>
            <Property label="Due">
              <DueDateInput
                value={task.dueDate}
                done={task.status === 'done'}
                onChange={(dueDate) => update(task.id, { dueDate })}
              />
            </Property>
            <Property label="Labels">
              <LabelsEditor labels={task.labels} onChange={(labels) => update(task.id, { labels })} />
            </Property>
            <Property label="Depends on">
              <Dependencies task={task} tasks={state.tasks} onChange={(dependsOn) => update(task.id, { dependsOn })} />
            </Property>
          </dl>

          <div className="mt-5">
            <EditableText
              value={task.description}
              onSave={(description) => update(task.id, { description })}
              className="min-h-16 text-sm leading-6"
              placeholder="Add a description…"
            />
          </div>

          <Attachments task={task} />

          <p className="mt-6 text-xs text-fg-faint">
            Created {format(new Date(task.createdAt), 'MMM d')}
            {task.completedAt && ` · Completed ${format(new Date(task.completedAt), 'MMM d')}`}
          </p>
        </div>

        <Comments task={task} members={state.members} />
      </div>

      <Dialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete ${task.key}?`}
        description="The task, its comments and attachments will be gone for everyone. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={deleteTask}>
            Delete task
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function Property({ label, children }) {
  return (
    <>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="-ml-2 min-w-0">{children}</dd>
    </>
  );
}

// Saves on blur. Keeps a local draft so remote updates to the same field don't
// clobber what you're typing; they're picked up again once you leave the field.
function EditableText({ value, onSave, placeholder, className, singleLine }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [synced, setSynced] = useState(value);

  if (!focused && value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  return (
    <textarea
      value={draft}
      placeholder={placeholder}
      rows={1}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(singleLine ? e.target.value.replace(/\n/g, '') : e.target.value)}
      onBlur={() => {
        setFocused(false);
        const next = draft.trim();
        if (next !== value.trim()) onSave(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (singleLine && e.key === 'Enter')) {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
        }
      }}
      className={`-mx-1.5 w-[calc(100%+12px)] resize-none rounded-md bg-transparent px-1.5 py-0.5 outline-none [field-sizing:content] hover:bg-subtle focus:bg-subtle ${className ?? ''}`}
    />
  );
}
