import { notFound } from '../../lib/errors.js';
import { authorize } from '../workspaces/access.js';
import { BoardModel } from './board.model.js';

export async function authorizeBoard(userId, boardId, action) {
  const board = await BoardModel.findById(boardId);
  if (!board) throw notFound('Board');
  const role = await authorize(userId, String(board.workspace), action);
  return { board, role };
}
