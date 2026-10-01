import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { BarChart3, Plus, Sparkles } from 'lucide-react';
import { useHotkey } from '@/lib/hotkeys';
import { Button } from '@/components/Button';
import { Kbd } from '@/components/Kbd';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState } from '@/components/States';
import { Tooltip } from '@/components/Tooltip';
import { useWorkspace } from '@/features/workspaces/api';
import { isAdmin } from '@/features/workspaces/permissions';
import { TaskSheet } from '@/features/tasks/TaskSheet';
import { NewTaskDialog } from '@/features/tasks/NewTaskDialog';
import { SprintReportDialog } from '@/features/ai/SprintReportDialog';
import { PrioritizeDialog } from '@/features/ai/PrioritizeDialog';
import { useBoard } from './api';
import { useBoardRealtime } from './useBoardRealtime';
import { BoardCanvas } from './BoardCanvas';
import { BoardMenu } from './BoardMenu';
import { BoardSkeleton } from './BoardSkeleton';
import { PresenceStack } from './PresenceStack';

// Panels on this page are driven by the URL (?task=PLAT-12, ?new=todo, ?report,
// ?prioritize) so they can be linked to, and opened from the command palette.
export function BoardPage() {
  const { workspaceId = '', boardId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: workspace } = useWorkspace(workspaceId);
  const board = useBoard(boardId);
  const { viewers, connected, gone } = useBoardRealtime(boardId);

  const setPanel = useCallback(
    (key, value) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const k of ['task', 'new', 'report', 'prioritize']) next.delete(k);
          if (value !== null) next.set(key, value);
          return next;
        },
        { replace: key !== 'task' },
      ),
    [setParams],
  );

  useHotkey('c', () => setPanel('new', 'backlog'), board.isSuccess);

  const openTask = useCallback((task) => setPanel('task', task.key), [setPanel]);
  const newTask = useCallback((status) => setPanel('new', status), [setPanel]);
  const close = () => setPanel('task', null);

  if (gone) {
    return (
      <EmptyState
        className="flex-1"
        title={gone === 'deleted' ? 'This board was deleted' : 'You no longer have access to this board'}
        body={
          gone === 'deleted'
            ? 'Someone deleted it while you had it open.'
            : 'You were removed from this workspace.'
        }
        action={
          <Link
            to={gone === 'deleted' ? `/w/${workspaceId}` : '/app'}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            {gone === 'deleted' ? 'Back to the workspace' : 'Go to your workspaces'}
          </Link>
        }
      />
    );
  }

  if (board.isError) return <ErrorState className="flex-1" error={board.error} onRetry={() => board.refetch()} />;

  const state = board.data;
  const taskKey = params.get('task');
  const openedTask = taskKey ? state?.tasks.find((t) => t.key === taskKey) : undefined;

  return (
    <>
      <PageHeader crumbs={[workspace?.name, state?.board.name]}>
        <PresenceStack viewers={viewers} connected={connected} />
        <div className="mx-0.5 hidden h-4 w-px bg-line sm:block" />
        <Button variant="ghost" size="sm" onClick={() => setPanel('prioritize', '1')} disabled={!state}>
          <Sparkles className="size-3.5" />
          <span className="hidden md:inline">Prioritize</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPanel('report', '1')} disabled={!state}>
          <BarChart3 className="size-3.5" />
          <span className="hidden md:inline">Sprint report</span>
        </Button>
        <Tooltip
          content={
            <>
              New task <Kbd className="border-transparent bg-canvas/20 text-canvas">C</Kbd>
            </>
          }
        >
          <Button variant="primary" size="sm" onClick={() => setPanel('new', 'backlog')} disabled={!state}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New task</span>
          </Button>
        </Tooltip>
        {state && isAdmin(state.role) && <BoardMenu board={state.board} />}
      </PageHeader>

      {!state ? (
        <BoardSkeleton />
      ) : (
        <>
          <BoardCanvas state={state} onOpenTask={openTask} onNewTask={newTask} />
          {state.tasks.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
              <p className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-fg-muted shadow-pop">
                This board is empty. Press <Kbd>C</Kbd> to create the first task.
              </p>
            </div>
          )}

          <TaskSheet
            state={state}
            task={openedTask}
            missingKey={taskKey && !openedTask ? taskKey : null}
            onClose={close}
          />
          <NewTaskDialog
            state={state}
            status={params.get('new')}
            onClose={() => setPanel('new', null)}
            onCreated={openTask}
          />
          <SprintReportDialog
            board={state.board}
            open={params.has('report')}
            onClose={() => setPanel('report', null)}
          />
          <PrioritizeDialog
            state={state}
            open={params.has('prioritize')}
            onClose={() => setPanel('prioritize', null)}
          />
        </>
      )}
    </>
  );
}
