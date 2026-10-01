import { notFound } from '../../lib/errors.js';
import { emitToBoard, evictFromBoards } from '../../realtime/emit.js';
import { discardObjects } from '../../services/storage.js';
import { ActivityModel } from '../activity/activity.model.js';
import { publicUser } from '../auth/user.model.js';
import { CommentModel } from '../comments/comment.model.js';
import { WorkspaceModel } from '../workspaces/workspace.model.js';
import { TaskModel } from '../tasks/task.model.js';
import { STATUSES, TRANSITIONS } from '../tasks/workflow.js';
import { BoardModel } from './board.model.js';

export function toBoardSummary(board) {
  return {
    id: String(board._id),
    workspaceId: String(board.workspace),
    name: board.name,
    key: board.key,
    description: board.description ?? '',
  };
}

export function toTaskDto(task, boardKey) {
  return {
    id: String(task._id),
    boardId: String(task.board),
    key: `${boardKey}-${task.number}`,
    number: task.number,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assignee ? String(task.assignee) : null,
    labels: task.labels,
    dueDate: task.dueDate,
    dependsOn: task.dependsOn.map(String),
    position: task.position,
    attachments: task.attachments.map((a) => ({
      id: String(a._id),
      name: a.name,
      size: a.size,
      contentType: a.contentType,
      uploadedAt: a.uploadedAt,
    })),
    createdBy: String(task.createdBy),
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

// Everything the board screen needs in one response: the board, all its tasks,
// the workspace members (for avatars and pickers) and the workflow rules.
export async function getBoardState(boardId) {
  const board = await BoardModel.findById(boardId).lean();
  if (!board) throw notFound('Board');

  const [tasks, workspace] = await Promise.all([
    TaskModel.find({ board: boardId }).sort({ position: 1 }).lean(),
    WorkspaceModel.findById(board.workspace).populate('members.user').lean(),
  ]);

  return {
    board: toBoardSummary(board),
    tasks: tasks.map((t) => toTaskDto(t, board.key)),
    members: workspace.members.map((m) => ({
      ...publicUser(m.user),
      role: m.role,
    })),
    workflow: { statuses: STATUSES, transitions: TRANSITIONS },
  };
}

// Deletes boards with everything on them, tells anyone viewing, and closes their
// rooms. Stored attachment files are cleaned up last, best-effort.
export async function deleteBoards(boardIds) {
  if (!boardIds.length) return;
  const attachmentKeys = await TaskModel.distinct('attachments.key', { board: { $in: boardIds } });

  await Promise.all([
    TaskModel.deleteMany({ board: { $in: boardIds } }),
    CommentModel.deleteMany({ board: { $in: boardIds } }),
    ActivityModel.deleteMany({ board: { $in: boardIds } }),
    BoardModel.deleteMany({ _id: { $in: boardIds } }),
  ]);

  for (const id of boardIds) emitToBoard(String(id), 'board:deleted', { id: String(id) });
  await evictFromBoards(boardIds);
  discardObjects(attachmentKeys);
}
