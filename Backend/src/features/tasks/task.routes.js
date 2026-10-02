import { Router } from 'express';
import { z } from 'zod';
import { forbidden } from '../../lib/errors.js';
import { authorizeBoard } from '../boards/access.js';
import { BoardModel } from '../boards/board.model.js';
import { toTaskDto } from '../boards/board.service.js';
import { canDeleteTask } from '../workspaces/permissions.js';
import { authorizeTask } from './access.js';
import { PRIORITIES } from './task.model.js';
import { STATUSES } from './workflow.js';
import { demoLocked } from '../demo/guard.js';
import { createTask, deleteTask, moveTask, updateTask } from './task.service.js';

export const taskRouter = Router();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20_000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: objectId.nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

const updateSchema = createSchema
  .omit({ status: true })
  .partial()
  .extend({
    dependsOn: z.array(objectId).max(20).optional(),
  });

const moveSchema = z.object({
  status: z.enum(STATUSES),
  position: z.number().finite(),
});

async function loadBoard(boardId) {
  return await BoardModel.findById(boardId).lean();
}

taskRouter.post('/boards/:boardId/tasks', async (req, res) => {
  const { board } = await authorizeBoard(req.userId, req.params.boardId, 'task:write');
  const task = await createTask(req.userId, board, createSchema.parse(req.body));
  res.status(201).json({ task });
});

taskRouter.get('/tasks/:taskId', async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'workspace:read');
  const board = await loadBoard(task.board);
  res.json({ task: toTaskDto(task.toObject(), board.key) });
});

taskRouter.patch('/tasks/:taskId', async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'task:write');
  const input = updateSchema.parse(req.body);
  const updated = await updateTask(req.userId, task, await loadBoard(task.board), input);
  res.json({ task: updated });
});

taskRouter.post('/tasks/:taskId/move', async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'task:write');
  const { status, position } = moveSchema.parse(req.body);
  const moved = await moveTask(req.userId, task, await loadBoard(task.board), status, position);
  res.json({ task: moved });
});

taskRouter.delete('/tasks/:taskId', async (req, res) => {
  const { task, role } = await authorizeTask(req.userId, req.params.taskId, 'task:write');
  if (!canDeleteTask(role, req.userId, task)) {
    throw forbidden('Only admins or the person who created this task can delete it');
  }
  const board = await loadBoard(task.board);
  // In the demo, visitors can delete tasks they added but not the seeded ones.
  if (req.isDemo && task.createdAt < board.createdAt) throw demoLocked();
  await deleteTask(req.userId, task, board);
  res.status(204).end();
});
