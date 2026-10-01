import { notFound } from '../../lib/errors.js';
import { authorize } from '../workspaces/access.js';
import { TaskModel } from './task.model.js';

export async function authorizeTask(userId, taskId, action) {
  const task = await TaskModel.findById(taskId);
  if (!task) throw notFound('Task');
  const role = await authorize(userId, String(task.workspace), action);
  return { task, role };
}
