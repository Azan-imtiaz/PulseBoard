import { ActivityModel } from '../activity/activity.model.js';
import { UserModel } from '../auth/user.model.js';
import { TaskModel } from '../tasks/task.model.js';

const DAY = 86_400_000;
const VELOCITY_WEEKS = 6;

// Buckets "moved to done" events into weeks ending today, oldest first.
// A task finished twice in the same week counts once.
export function weeklyCompletions(events, weeks, now = new Date()) {
  const end = now.getTime();
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    weekStart: new Date(end - (weeks - i) * 7 * DAY).toISOString().slice(0, 10),
    tasks: new Set(),
  }));

  for (const event of events) {
    const weeksAgo = Math.floor((end - event.at.getTime()) / (7 * DAY));
    if (weeksAgo < 0 || weeksAgo >= weeks) continue;
    buckets[weeks - 1 - weeksAgo].tasks.add(event.task);
  }

  return buckets.map((b) => ({ weekStart: b.weekStart, completed: b.tasks.size }));
}

export async function collectSprintFacts(board, days) {
  const boardId = board._id;
  const now = new Date();
  const from = new Date(now.getTime() - days * DAY);
  const velocityFrom = new Date(now.getTime() - VELOCITY_WEEKS * 7 * DAY);

  const [tasks, doneEvents, blockedEvents, createdCount] = await Promise.all([
    TaskModel.find({ board: boardId }).lean(),
    ActivityModel.find({
      board: boardId,
      type: 'task.moved',
      'data.to': 'done',
      createdAt: { $gte: velocityFrom },
    }).lean(),
    ActivityModel.find({ board: boardId, type: 'task.moved', 'data.to': 'blocked' }).sort({ createdAt: -1 }).lean(),
    ActivityModel.countDocuments({ board: boardId, type: 'task.created', createdAt: { $gte: from } }),
  ]);

  const assigneeIds = [
    ...new Set(
      tasks
        .map((t) => t.assignee)
        .filter(Boolean)
        .map(String),
    ),
  ];
  const users = await UserModel.find({ _id: { $in: assigneeIds } })
    .select('name')
    .lean();
  const nameOf = (id) => (id ? (users.find((u) => String(u._id) === String(id))?.name ?? null) : null);
  const summary = (t) => ({ key: `${board.key}-${t.number}`, title: t.title, assignee: nameOf(t.assignee) });

  const blockedSince = new Map();
  for (const event of blockedEvents) {
    if (!blockedSince.has(String(event.task))) blockedSince.set(String(event.task), event.createdAt);
  }

  return {
    board: board.name,
    from,
    to: now,
    shipped: tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt >= from).map(summary),
    blocked: tasks
      .filter((t) => t.status === 'blocked')
      .map((t) => {
        const since = blockedSince.get(String(t._id)) ?? t.updatedAt;
        return { ...summary(t), daysBlocked: Math.floor((now.getTime() - since.getTime()) / DAY) };
      }),
    inProgress: tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').map(summary),
    createdCount,
    velocity: weeklyCompletions(
      doneEvents.map((e) => ({ task: String(e.task), at: e.createdAt })),
      VELOCITY_WEEKS,
      now,
    ),
  };
}

export async function collectPriorityCandidates(board) {
  const tasks = await TaskModel.find({ board: board._id, status: { $ne: 'done' } }).lean();
  const now = Date.now();
  const openIds = new Set(tasks.map((t) => String(t._id)));

  return tasks.map((task) => {
    const id = String(task._id);
    return {
      taskId: id,
      key: `${board.key}-${task.number}`,
      title: task.title,
      status: task.status,
      priority: task.priority,
      daysUntilDue: task.dueDate ? Math.round((task.dueDate.getTime() - now) / DAY) : null,
      blocksOpenTasks: tasks.filter((t) => t.dependsOn.some((d) => String(d) === id)).length,
      waitingOnOpenTasks: task.dependsOn.filter((d) => openIds.has(String(d))).length,
      daysSinceActivity: Math.floor((now - task.updatedAt.getTime()) / DAY),
    };
  });
}
