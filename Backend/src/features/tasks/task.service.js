import { HttpError } from '../../lib/errors.js';
import { emitToBoard } from '../../realtime/emit.js';
import { discardObjects } from '../../services/storage.js';
import { recordActivity } from '../activity/activity.model.js';
import { BoardModel } from '../boards/board.model.js';
import { CommentModel } from '../comments/comment.model.js';
import { toTaskDto } from '../boards/board.service.js';
import { getRole } from '../workspaces/access.js';
import { notifyAssigned } from '../notifications/notify.js';
import { TaskModel } from './task.model.js';
import { checkTransition, statusTimestamps } from './workflow.js';

const POSITION_GAP = 1024;

async function assertMember(workspaceId, userId) {
  if (!(await getRole(String(workspaceId), userId))) {
    throw new HttpError(400, 'Assignee must be a member of this workspace', 'invalid_assignee');
  }
}

export async function createTask(userId, board, input) {
  if (input.assigneeId) await assertMember(board.workspace, input.assigneeId);

  const status = input.status ?? 'backlog';
  if (status === 'in_progress' && !input.assigneeId) {
    throw new HttpError(422, 'Assign someone before starting this task', 'invalid_transition');
  }

  const [counter, last] = await Promise.all([
    BoardModel.findByIdAndUpdate(board._id, { $inc: { taskCounter: 1 } }, { new: true }),
    TaskModel.findOne({ board: board._id, status }).sort({ position: -1 }).select('position').lean(),
  ]);

  const task = await TaskModel.create({
    board: board._id,
    workspace: board.workspace,
    number: counter.taskCounter,
    title: input.title,
    description: input.description,
    status,
    priority: input.priority,
    assignee: input.assigneeId ?? null,
    labels: input.labels,
    dueDate: input.dueDate,
    position: (last?.position ?? 0) + POSITION_GAP,
    createdBy: userId,
    ...statusTimestamps('backlog', status),
  });

  await recordActivity({ board: board._id, task: task._id, actor: userId, type: 'task.created' });
  if (task.assignee) notifyAssigned(task, board, userId);

  const dto = toTaskDto(task.toObject(), board.key);
  emitToBoard(String(board._id), 'task:created', dto);
  return dto;
}

export async function updateTask(userId, task, board, input) {
  const previousAssignee = task.assignee ? String(task.assignee) : null;
  const { assigneeId, dependsOn, ...fields } = input;

  if (assigneeId !== undefined) {
    if (assigneeId) await assertMember(board.workspace, assigneeId);
    task.set('assignee', assigneeId);
  }
  if (dependsOn !== undefined) {
    await assertValidDependencies(task, dependsOn);
    task.set('dependsOn', dependsOn);
  }
  if (fields.dueDate !== undefined) task.dueReminderSentAt = null;
  task.set(fields);

  await task.save();

  const assigneeChanged = assigneeId !== undefined && (assigneeId ?? null) !== previousAssignee;
  if (assigneeChanged) {
    await recordActivity({
      board: board._id,
      task: task._id,
      actor: userId,
      type: 'task.assigned',
      data: { from: previousAssignee, to: assigneeId },
    });
    if (task.assignee) notifyAssigned(task, board, userId);
  }

  const dto = toTaskDto(task.toObject(), board.key);
  emitToBoard(String(board._id), 'task:updated', dto);
  return dto;
}

export async function moveTask(userId, task, board, to, position) {
  const from = task.status;

  if (from !== to) {
    const openDependencies = task.dependsOn.length
      ? await TaskModel.countDocuments({ _id: { $in: task.dependsOn }, status: { $ne: 'done' } })
      : 0;
    const check = checkTransition({ status: from, assignee: task.assignee }, to, openDependencies);
    if (!check.ok) throw new HttpError(422, check.reason, 'invalid_transition');

    task.set({ status: to, ...statusTimestamps(from, to) });
  }
  task.position = position;
  await task.save();

  if (from !== to) {
    await recordActivity({ board: board._id, task: task._id, actor: userId, type: 'task.moved', data: { from, to } });
  }

  const dto = toTaskDto(task.toObject(), board.key);
  emitToBoard(String(board._id), 'task:updated', dto);
  return dto;
}

export async function deleteTask(userId, task, board) {
  await Promise.all([
    task.deleteOne(),
    CommentModel.deleteMany({ task: task._id }),
    TaskModel.updateMany({ dependsOn: task._id }, { $pull: { dependsOn: task._id } }),
    recordActivity({
      board: board._id,
      task: task._id,
      actor: userId,
      type: 'task.deleted',
      data: { title: task.title },
    }),
  ]);
  discardObjects(task.attachments.map((a) => a.key));
  emitToBoard(String(board._id), 'task:deleted', { id: String(task._id) });
}

async function assertValidDependencies(task, dependsOn) {
  const taskId = String(task._id);
  if (dependsOn.includes(taskId)) {
    throw new HttpError(400, 'A task cannot depend on itself', 'invalid_dependency');
  }

  const boardTasks = await TaskModel.find({ board: task.board }).select('dependsOn').lean();
  const graph = new Map(boardTasks.map((t) => [String(t._id), t.dependsOn.map(String)]));

  if (dependsOn.some((id) => !graph.has(id))) {
    throw new HttpError(400, 'Dependencies must be tasks on the same board', 'invalid_dependency');
  }

  graph.set(taskId, dependsOn);
  if (reaches(graph, dependsOn, taskId)) {
    throw new HttpError(400, 'That would create a circular dependency', 'invalid_dependency');
  }
}

// Depth-first walk over dependency edges looking for `target`.
function reaches(graph, start, target) {
  const stack = [...start];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (id === target) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(graph.get(id) ?? []));
  }
  return false;
}
