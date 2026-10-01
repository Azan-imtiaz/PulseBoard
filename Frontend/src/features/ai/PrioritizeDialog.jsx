import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { useTaskMutations } from '@/features/boards/api';
import { PRIORITY_LABEL, PriorityIcon } from '@/features/tasks/meta';
import { aiErrorMessage } from './errors';

export function PrioritizeDialog({ state, open, onClose }) {
  const { update } = useTaskMutations(state.board.id);
  const result = useQuery({
    queryKey: ['prioritize', state.board.id],
    queryFn: () => api(`/ai/boards/${state.board.id}/prioritize`, { method: 'POST' }),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  // Everything starts selected; track what the user unticks.
  const [skipped, setSkipped] = useState(new Set());
  const chosen = result.data?.suggestions.filter((s) => !skipped.has(s.taskId)) ?? [];

  function close() {
    setSkipped(new Set());
    onClose();
  }

  function apply() {
    chosen.forEach((s) => update(s.taskId, { priority: s.priority }));
    toast.success(`Updated ${chosen.length} ${chosen.length === 1 ? 'priority' : 'priorities'}`);
    close();
  }

  const toggle = (id) =>
    setSkipped((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title="Suggested priorities"
      description="Based on due dates, what each task blocks, and how long it's been idle."
      className="top-[10vh] max-w-xl"
    >
      {result.isPending && (
        <div className="space-y-2" aria-busy>
          <p className="text-sm text-fg-muted">
            Weighing {state.tasks.filter((t) => t.status !== 'done').length} open tasks…
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      )}

      {result.isError && (
        <div className="rounded-lg border border-line px-4 py-5 text-sm">
          <p className="text-fg-muted">{aiErrorMessage(result.error)}</p>
          <Button className="mt-3" size="sm" onClick={() => result.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {result.data && (
        <>
          <p className="text-sm leading-6">{result.data.overview}</p>

          {result.data.suggestions.length === 0 ? (
            <p className="mt-4 rounded-lg border border-line px-4 py-5 text-center text-sm text-fg-muted">
              Current priorities already match the signals. Nothing to change.
            </p>
          ) : (
            <ul className="scroll-thin mt-4 max-h-[50vh] space-y-1.5 overflow-y-auto">
              {result.data.suggestions.map((s) => {
                const task = state.tasks.find((t) => t.id === s.taskId);
                return (
                  <li key={s.taskId}>
                    <label className="flex cursor-pointer gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-line-strong has-[:checked]:border-line-strong">
                      <input
                        type="checkbox"
                        checked={!skipped.has(s.taskId)}
                        onChange={() => toggle(s.taskId)}
                        className="mt-1 accent-(--accent)"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs text-fg-faint">{s.key}</span>
                          <span className="truncate text-sm">{task?.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-fg-muted">
                          <PriorityIcon priority={s.currentPriority} className="size-3" />
                          {PRIORITY_LABEL[s.currentPriority]}
                          <ArrowRight className="size-3 text-fg-faint" />
                          <PriorityIcon priority={s.priority} className="size-3" />
                          <span className="font-medium text-fg">{PRIORITY_LABEL[s.priority]}</span>
                        </div>
                        <p className="mt-1 text-xs text-fg-muted">{s.reason}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
            {result.data.suggestions.length > 0 && (
              <Button variant="primary" onClick={apply} disabled={chosen.length === 0}>
                Apply {chosen.length} {chosen.length === 1 ? 'change' : 'changes'}
              </Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
