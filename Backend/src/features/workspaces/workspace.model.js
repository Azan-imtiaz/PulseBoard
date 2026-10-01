import { Schema, model, Types } from 'mongoose';
import { ROLES } from './permissions.js';

const memberSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Members are embedded: a workspace has tens of members, not thousands, and every
// permission check needs them alongside the workspace anyway.
const workspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true },
);

workspaceSchema.index({ 'members.user': 1 });

export const WorkspaceModel = model('Workspace', workspaceSchema);
