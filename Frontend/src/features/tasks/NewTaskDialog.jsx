import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { modKey } from '@/lib/format';
import { Button } from '@/components/Button';
import { Kbd } from '@/components/Kbd';
import { useTaskMutations } from '@/features/boards/api';
import { AssigneePicker, PriorityPicker, StatusPicker } from './Pickers';
import { DueDateInput } from './DueDateInput';

export function NewTaskDialog({ state, status, onClose, onCreated }) {
  return (
    <RadixDialog.Root open={status !== null} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <RadixDialog.Content className="fixed top-[14vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 rounded-xl bg-surface shadow-pop outline-none data-[state=open]:animate-[dialog-in_180ms_var(--ease-out-quint)]">
          {/* Content unmounts when closed, so the form starts fresh on every open. */}
          {status && <NewTaskForm state={state} initialStatus={status} onCreated={onCreated} />}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function NewTaskForm({ state, initialStatus, onCreated }) {
  const { create } = useTaskMutations(state.board.id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('none');
  const [assigneeId, setAssigneeId] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [createMore, setCreateMore] = useState(false);

  function submit(event) {
    event?.preventDefault();
    if (!title.trim() || create.isPending) return;
    create.mutate(
      { title, description, status, priority, assigneeId, dueDate },
      {
        onSuccess: (task) => {
          if (!createMore) return onCreated(task);
          setTitle('');
          setDescription('');
        },
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
      }}
    >
      <div className="px-5 pt-4">
        <RadixDialog.Title className="text-xs font-medium text-fg-muted">
          <span className="mr-1.5 rounded-sm bg-subtle px-1.5 py-0.5 font-mono text-2xs">{state.board.key}</span>
          New task
        </RadixDialog.Title>
        <RadixDialog.Description className="sr-only">Create a task on {state.board.name}</RadixDialog.Description>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="mt-3 w-full bg-transparent text-lg font-medium tracking-tight outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description…"
          rows={3}
          className="mt-1 w-full resize-none bg-transparent text-sm leading-6 text-fg outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-1.5 pb-4">
          <StatusPicker bordered value={status} statuses={state.workflow.statuses} onChange={setStatus} />
          <PriorityPicker bordered value={priority} onChange={setPriority} />
          <AssigneePicker
            bordered
            value={assigneeId}
            members={state.members}
            onChange={setAssigneeId}
            placeholder="Assignee"
          />
          <DueDateInput bordered value={dueDate} onChange={setDueDate} />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-line px-5 py-3">
        {create.error ? (
          <p className="min-w-0 flex-1 truncate text-sm text-danger">{create.error.message}</p>
        ) : (
          <label className="flex flex-1 items-center gap-2 text-xs text-fg-muted select-none">
            <input
              type="checkbox"
              checked={createMore}
              onChange={(e) => setCreateMore(e.target.checked)}
              className="accent-(--accent)"
            />
            Create more
          </label>
        )}
        <Button type="submit" variant="primary" size="sm" loading={create.isPending} disabled={!title.trim()}>
          Create task
          <span className="flex gap-0.5 opacity-70">
            <Kbd className="h-4 min-w-4 border-transparent bg-white/15 text-inherit">{modKey}</Kbd>
            <Kbd className="h-4 min-w-4 border-transparent bg-white/15 text-inherit">↵</Kbd>
          </span>
        </Button>
      </div>
    </form>
  );
}
