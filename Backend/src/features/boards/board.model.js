import { Schema, model, Types } from 'mongoose';

const boardSchema = new Schema(
  {
    workspace: { type: Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Short prefix for human-readable task ids, e.g. PLAT-42.
    key: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    taskCounter: { type: Number, default: 0 },
  },
  { timestamps: true },
);

boardSchema.index({ workspace: 1, key: 1 }, { unique: true });

export const BoardModel = model('Board', boardSchema);
