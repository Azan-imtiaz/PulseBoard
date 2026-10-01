export const STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done'];

export const TRANSITIONS = {
  backlog: ['todo', 'in_progress'],
  todo: ['backlog', 'in_progress'],
  in_progress: ['todo', 'blocked', 'in_review'],
  blocked: ['todo', 'in_progress'],
  in_review: ['in_progress', 'done'],
  done: ['todo', 'in_review'],
};

export function checkTransition(task, to, openDependencies = 0) {
  if (task.status === to) return { ok: true };

  if (!TRANSITIONS[task.status].includes(to)) {
    return { ok: false, reason: `Can't move a task from ${label(task.status)} to ${label(to)}` };
  }
  if (to === 'in_progress' && !task.assignee) {
    return { ok: false, reason: 'Assign someone before starting this task' };
  }
  if ((to === 'in_progress' || to === 'done') && openDependencies > 0) {
    const noun = openDependencies === 1 ? 'dependency' : 'dependencies';
    return { ok: false, reason: `Waiting on ${openDependencies} open ${noun}` };
  }
  return { ok: true };
}

// Timestamps that follow from entering a status. Leaving "done" clears completedAt
// so a reopened task stops counting as shipped.
export function statusTimestamps(from, to, now = new Date()) {
  const changes = {};
  if (to === 'in_progress' && from !== 'blocked') changes.startedAt = now;
  if (to === 'done') changes.completedAt = now;
  if (from === 'done' && to !== 'done') changes.completedAt = null;
  return changes;
}

function label(status) {
  return status.replace('_', ' ');
}
