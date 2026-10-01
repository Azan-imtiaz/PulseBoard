import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/Button';
import { STATUS_LABEL, StatusIcon } from '@/features/tasks/meta';
import { positionBetween, useTaskMutations } from './api';
import { TaskCard } from './TaskCard';
import { LiveCursors, useCursorBroadcast } from './LiveCursors';

const COLUMN_PREFIX = 'column:';

function toColumns(tasks, statuses) {
  const columns = Object.fromEntries(statuses.map((s) => [s, []]));
  for (const task of [...tasks].sort((a, b) => a.position - b.position)) columns[task.status].push(task.id);
  return columns;
}

// Slight overshoot on settle, so a dropped card feels like it lands rather than fades.
const dropAnimation = { duration: 260, easing: 'cubic-bezier(0.2, 1.1, 0.4, 1)' };

export function BoardCanvas({ state, onOpenTask, onNewTask }) {
  const { statuses, transitions } = state.workflow;
  const { move } = useTaskMutations(state.board.id);
  const cursor = useCursorBroadcast();

  const tasksById = useMemo(() => new Map(state.tasks.map((t) => [t.id, t])), [state.tasks]);
  const membersById = useMemo(() => new Map(state.members.map((m) => [m.id, m])), [state.members]);
  const columns = useMemo(() => toColumns(state.tasks, statuses), [state.tasks, statuses]);

  // While dragging we render from a local copy of the columns so the card can move
  // between them before anything is committed.
  const [drag, setDrag] = useState(null);
  const shown = drag?.columns ?? columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const canDrop = (status) => !drag || status === drag.task.status || transitions[drag.task.status].includes(status);

  // Prefer whatever card is under the pointer, falling back to the nearest one.
  // Plain corner/center matching makes a card flicker between two neighbours
  // after it hops columns, because each hop shifts the layout under it.
  const collisionDetection = useCallback((args) => {
    const underPointer = pointerWithin(args);
    const hits = underPointer.length > 0 ? underPointer : closestCenter(args);
    const cardHit = hits.find((hit) => !String(hit.id).startsWith(COLUMN_PREFIX));
    return cardHit ? [cardHit] : hits.slice(0, 1);
  }, []);

  function columnOf(id, current) {
    if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length);
    return statuses.find((s) => current[s].includes(id));
  }

  function onDragStart({ active }) {
    const task = tasksById.get(String(active.id));
    if (task) setDrag({ task, columns });
  }

  function onDragOver({ active, over }) {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // Work from the latest columns inside the updater, and bail out without a new
    // object when nothing changes; otherwise dnd-kit re-measures and fires again.
    setDrag((current) => {
      if (!current) return current;
      const from = columnOf(activeId, current.columns);
      const to = columnOf(overId, current.columns);
      if (!from || !to || from === to || !canDrop(to)) return current;

      const target = current.columns[to].filter((id) => id !== activeId);
      const overIndex = target.indexOf(overId);
      target.splice(overIndex === -1 ? target.length : overIndex, 0, activeId);
      return {
        ...current,
        columns: { ...current.columns, [from]: current.columns[from].filter((id) => id !== activeId), [to]: target },
      };
    });
  }

  function onDragEnd({ active, over }) {
    const current = drag;
    setDrag(null);
    if (!current || !over) return;

    const activeId = String(active.id);
    const status = columnOf(activeId, current.columns);
    if (!status) return;

    let ids = current.columns[status];
    const overIndex = ids.indexOf(String(over.id));
    const activeIndex = ids.indexOf(activeId);
    if (overIndex !== -1 && overIndex !== activeIndex) ids = arrayMove(ids, activeIndex, overIndex);

    const index = ids.indexOf(activeId);
    const unchanged = status === current.task.status && columns[status].indexOf(activeId) === index;
    if (unchanged) return;

    const before = tasksById.get(ids[index - 1])?.position;
    const after = tasksById.get(ids[index + 1])?.position;
    move(activeId, status, positionBetween(before, after));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
    >
      <div className="scroll-thin flex-1 overflow-auto bg-canvas">
        <div className="relative flex min-h-full w-max gap-3 p-4" {...cursor}>
          {statuses.map((status) => (
            <Column
              key={status}
              status={status}
              taskIds={shown[status]}
              tasksById={tasksById}
              membersById={membersById}
              disabled={!canDrop(status)}
              draggingId={drag?.task.id}
              onOpenTask={onOpenTask}
              onNewTask={() => onNewTask(status)}
            />
          ))}
          <LiveCursors />
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {drag && (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.03, rotate: -1.5 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className="cursor-grabbing rounded-lg shadow-lift"
          >
            <TaskCard
              task={drag.task}
              assignee={drag.task.assigneeId ? membersById.get(drag.task.assigneeId) : undefined}
            />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, taskIds, tasksById, membersById, disabled, draggingId, onOpenTask, onNewTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${status}`, disabled });

  return (
    <section
      className={cn('flex w-[280px] shrink-0 flex-col transition-opacity duration-150', disabled && 'opacity-40')}
      aria-label={STATUS_LABEL[status]}
    >
      <header className="group/col flex h-8 items-center gap-2 px-1.5">
        <StatusIcon status={status} />
        <h2 className="text-sm font-medium">{STATUS_LABEL[status]}</h2>
        <span className="text-xs text-fg-faint tabular-nums">{taskIds.length}</span>
        {disabled && <span className="ml-auto text-2xs text-fg-faint">Can't move here</span>}
        {!disabled && !draggingId && (
          <IconButton
            label={`New task in ${STATUS_LABEL[status]}`}
            className="ml-auto size-6 opacity-0 group-hover/col:opacity-100"
            onClick={onNewTask}
          >
            <Plus className="size-3.5" />
          </IconButton>
        )}
      </header>

      <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'mt-1 flex min-h-24 flex-1 flex-col gap-1.5 rounded-lg p-0.5 transition-colors duration-150',
            isOver && !disabled && 'bg-accent-soft',
          )}
        >
          {taskIds.map((id) => {
            const task = tasksById.get(id);
            if (!task) return null;
            return (
              <SortableCard
                key={id}
                task={task}
                assignee={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
                onOpen={onOpenTask}
              />
            );
          })}
          {taskIds.length === 0 && !draggingId && (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-fg-faint">
              No tasks
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({ task, assignee, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const { onKeyDown: dragKeyDown, ...dragListeners } = listeners ?? {};

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      assignee={assignee}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="cursor-pointer"
      {...attributes}
      {...dragListeners}
      onClick={() => onOpen(task)}
      // Enter opens the task; Space picks it up for keyboard dragging.
      onKeyDown={(e) => (e.key === 'Enter' ? onOpen(task) : dragKeyDown?.(e))}
    />
  );
}
