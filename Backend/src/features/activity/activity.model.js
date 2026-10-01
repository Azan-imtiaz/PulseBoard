import { Schema, model, Types } from 'mongoose';

export const ACTIVITY_TYPES = ['task.created', 'task.moved', 'task.assigned', 'task.deleted', 'comment.added'];

// Append-only log. Sprint reports and velocity are computed from this rather than
// from current task state, so moving a task back out of "done" doesn't rewrite history.
const activitySchema = new Schema({
  board: { type: Types.ObjectId, ref: 'Board', required: true },
  task: { type: Types.ObjectId, ref: 'Task', required: true },
  actor: { type: Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ACTIVITY_TYPES, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

activitySchema.index({ board: 1, createdAt: -1 });

export const ActivityModel = model('Activity', activitySchema);

export function recordActivity(entry) {
  return ActivityModel.create(entry);
}
