import { Schema, model, Types } from 'mongoose';

const commentSchema = new Schema(
  {
    task: { type: Types.ObjectId, ref: 'Task', required: true, index: true },
    board: { type: Types.ObjectId, ref: 'Board', required: true },
    author: { type: Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    mentions: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

export const CommentModel = model('Comment', commentSchema);
