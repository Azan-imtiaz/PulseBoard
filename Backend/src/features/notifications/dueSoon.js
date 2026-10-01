import { logger } from '../../lib/logger.js';
import { BoardModel } from '../boards/board.model.js';
import { TaskModel } from '../tasks/task.model.js';
import { notifyDueSoon } from './notify.js';

const SWEEP_INTERVAL_MS = 15 * 60_000;
const DUE_WITHIN_MS = 24 * 60 * 60_000;

// Every instance runs this sweep. Each reminder is claimed with a conditional
// update, so the instances race harmlessly and a task is only ever emailed once.
async function sweep() {
  const cutoff = new Date(Date.now() + DUE_WITHIN_MS);

  for (;;) {
    const task = await TaskModel.findOneAndUpdate(
      {
        dueDate: { $gte: new Date(), $lte: cutoff },
        dueReminderSentAt: null,
        assignee: { $ne: null },
        status: { $ne: 'done' },
      },
      { $set: { dueReminderSentAt: new Date() } },
    );
    if (!task) break;
    const board = await BoardModel.findById(task.board).lean();
    if (board) await notifyDueSoon(task, board);
  }
}

export function startDueSoonReminders() {
  const run = () => sweep().catch((err) => logger.error({ err }, 'due-soon sweep failed'));
  run();
  return setInterval(run, SWEEP_INTERVAL_MS);
}
