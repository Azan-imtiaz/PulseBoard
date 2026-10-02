import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound } from '../../lib/errors.js';
import { discardObjects, presignDownload, presignUpload, statObject } from '../../services/storage.js';
import { emitToBoard } from '../../realtime/emit.js';
import { BoardModel } from '../boards/board.model.js';
import { toTaskDto } from '../boards/board.service.js';
import { authorizeTask } from '../tasks/access.js';
import { blockInDemo } from '../demo/guard.js';

export const attachmentRouter = Router();

const MAX_BYTES = 25 * 1024 * 1024;

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive().max(MAX_BYTES, 'Files can be up to 25 MB'),
});

const confirmSchema = z.object({
  key: z.string(),
  name: z.string().trim().min(1).max(200),
});

const keyPrefix = (task) => `workspaces/${task.workspace}/tasks/${task._id}/`;

async function publishTask(task) {
  const board = await BoardModel.findById(task.board).lean();
  const dto = toTaskDto(task.toObject(), board.key);
  emitToBoard(String(task.board), 'task:updated', dto);
  return dto;
}

// Step 1: the client asks for a short-lived URL and PUTs the file straight to S3.
attachmentRouter.post('/tasks/:taskId/attachments/upload-url', blockInDemo, async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'task:write');
  const input = uploadSchema.parse(req.body);

  const safeName = input.name.replace(/[^\w.-]+/g, '_').slice(-100);
  const key = `${keyPrefix(task)}${randomUUID()}-${safeName}`;
  const uploadUrl = await presignUpload(key, input.contentType, input.size);

  res.json({ key, uploadUrl, headers: { 'Content-Type': input.contentType } });
});

// Step 2: once the upload finishes, the client confirms it and we record it on the task.
// We read size and type back from S3 rather than trusting the client.
attachmentRouter.post('/tasks/:taskId/attachments', blockInDemo, async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'task:write');
  const input = confirmSchema.parse(req.body);

  if (!input.key.startsWith(keyPrefix(task)))
    throw new HttpError(400, 'Upload key does not belong to this task', 'invalid_key');
  const object = await statObject(input.key);
  if (!object) throw new HttpError(400, 'Upload not found. Try uploading again.', 'upload_missing');

  task.attachments.push({ key: input.key, name: input.name, ...object, uploadedBy: req.userId });
  await task.save();

  res.status(201).json({ task: await publishTask(task) });
});

attachmentRouter.get('/tasks/:taskId/attachments/:attachmentId/url', async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'workspace:read');
  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw notFound('Attachment');

  res.json({ url: await presignDownload(attachment.key, attachment.name) });
});

attachmentRouter.delete('/tasks/:taskId/attachments/:attachmentId', blockInDemo, async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'task:write');
  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw notFound('Attachment');

  const { key } = attachment;
  attachment.deleteOne();
  await task.save();
  discardObjects([key]);

  res.json({ task: await publishTask(task) });
});
