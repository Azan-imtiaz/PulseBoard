import { Router } from 'express';
import { z } from 'zod';
import { emitToBoard } from '../../realtime/emit.js';
import { recordActivity } from '../activity/activity.model.js';
import { BoardModel } from '../boards/board.model.js';
import { notifyMentioned } from '../notifications/notify.js';
import { authorizeTask } from '../tasks/access.js';
import { WorkspaceModel } from '../workspaces/workspace.model.js';
import { CommentModel } from './comment.model.js';

export const commentRouter = Router();

const createSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
});

function toCommentDto(comment) {
  return {
    id: String(comment._id),
    taskId: String(comment.task),
    body: comment.body,
    mentions: comment.mentions.map(String),
    createdAt: comment.createdAt,
    author: {
      id: String(comment.author._id),
      name: comment.author.name,
      username: comment.author.username,
      color: comment.author.color,
      avatarUrl: comment.author.avatarUrl ?? null,
    },
  };
}

commentRouter.get('/tasks/:taskId/comments', async (req, res) => {
  await authorizeTask(req.userId, req.params.taskId, 'workspace:read');
  const comments = await CommentModel.find({ task: req.params.taskId })
    .sort({ createdAt: 1 })
    .populate('author', 'name username color avatarUrl')
    .lean();
  res.json({ comments: comments.map((c) => toCommentDto(c)) });
});

commentRouter.post('/tasks/:taskId/comments', async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'comment:write');
  const input = createSchema.parse(req.body);

  // Mentions are read from the body (@username). Anything that isn't a member of
  // this workspace is just text.
  const workspace = await WorkspaceModel.findById(task.workspace).populate('members.user', 'username').lean();
  const memberByUsername = new Map(workspace.members.map((m) => [m.user.username, String(m.user._id)]));
  const mentioned = [...input.body.matchAll(/@([a-z0-9._]+[a-z0-9])/gi)].map((match) => match[1].toLowerCase());
  const mentions = [...new Set(mentioned.map((u) => memberByUsername.get(u)).filter(Boolean))];

  const comment = await CommentModel.create({
    task: task._id,
    board: task.board,
    author: req.userId,
    body: input.body,
    mentions,
  });
  await comment.populate('author', 'name username color avatarUrl');
  await recordActivity({ board: task.board, task: task._id, actor: req.userId, type: 'comment.added' });

  const board = await BoardModel.findById(task.board).lean();
  notifyMentioned(task, board, req.userId, mentions, input.body);

  const dto = toCommentDto(comment.toObject());
  emitToBoard(String(task.board), 'comment:created', dto);
  res.status(201).json({ comment: dto });
});
