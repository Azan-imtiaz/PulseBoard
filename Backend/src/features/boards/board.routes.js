import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/errors.js';
import { authorize } from '../workspaces/access.js';
import { BoardModel } from './board.model.js';
import { authorizeBoard } from './access.js';
import { deleteBoards, getBoardState, toBoardSummary } from './board.service.js';
import { emitToBoard } from '../../realtime/emit.js';

export const boardRouter = Router();

const createBoardSchema = z.object({
  name: z.string().trim().min(1).max(80),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,5}$/, 'Use 2–6 letters or digits, starting with a letter'),
  description: z.string().max(500).optional(),
});

const updateBoardSchema = createBoardSchema.pick({ name: true, description: true }).partial();

boardRouter.get('/workspaces/:workspaceId/boards', async (req, res) => {
  await authorize(req.userId, req.params.workspaceId, 'workspace:read');
  const boards = await BoardModel.find({ workspace: req.params.workspaceId }).sort({ createdAt: 1 }).lean();
  res.json({ boards: boards.map(toBoardSummary) });
});

boardRouter.post('/workspaces/:workspaceId/boards', async (req, res) => {
  const { workspaceId } = req.params;
  await authorize(req.userId, workspaceId, 'board:create');
  const input = createBoardSchema.parse(req.body);

  if (await BoardModel.exists({ workspace: workspaceId, key: input.key })) {
    throw new HttpError(409, `Another board already uses the key ${input.key}`, 'key_taken');
  }

  const board = await BoardModel.create({ ...input, workspace: workspaceId });
  res.status(201).json({ board: toBoardSummary(board) });
});

boardRouter.get('/boards/:boardId', async (req, res) => {
  const { board, role } = await authorizeBoard(req.userId, req.params.boardId, 'workspace:read');
  const state = await getBoardState(String(board._id));
  res.json({ ...state, role });
});

boardRouter.patch('/boards/:boardId', async (req, res) => {
  const { board } = await authorizeBoard(req.userId, req.params.boardId, 'board:update');
  const input = updateBoardSchema.parse(req.body);

  board.set(input);
  await board.save();

  const summary = toBoardSummary(board);
  emitToBoard(summary.id, 'board:updated', summary);
  res.json({ board: summary });
});

boardRouter.delete('/boards/:boardId', async (req, res) => {
  const { board } = await authorizeBoard(req.userId, req.params.boardId, 'board:delete');
  await deleteBoards([board._id]);
  res.status(204).end();
});
