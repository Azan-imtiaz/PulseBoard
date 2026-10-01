import { Schema, model, Types } from 'mongoose';
import { STATUSES } from './workflow.js';

export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];

const attachmentSchema = new Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
  contentType: { type: String, required: true },
  uploadedBy: { type: Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema(
  {
    board: { type: Types.ObjectId, ref: 'Board', required: true },
    workspace: { type: Types.ObjectId, ref: 'Workspace', required: true },
    number: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'backlog' },
    priority: { type: String, enum: PRIORITIES, default: 'none' },
    assignee: { type: Types.ObjectId, ref: 'User', default: null },
    labels: { type: [String], default: [] },
    dueDate: { type: Date, default: null },
    dependsOn: { type: [{ type: Types.ObjectId, ref: 'Task' }], default: [] },
    // Fractional ordering within a column; a move only rewrites the moved task.
    position: { type: Number, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    dueReminderSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ board: 1, status: 1, position: 1 });
taskSchema.index({ board: 1, number: 1 }, { unique: true });
taskSchema.index({ dueDate: 1, dueReminderSentAt: 1 });

export const TaskModel = model('Task', taskSchema);
