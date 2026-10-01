import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from '../../middleware/rateLimit.js';
import { summarizeThread, suggestPriorities, writeSprintReport } from '../../services/ai/index.js';
import { authorizeBoard } from '../boards/access.js';
import { BoardModel } from '../boards/board.model.js';
import { CommentModel } from '../comments/comment.model.js';
import { authorizeTask } from '../tasks/access.js';
import { collectPriorityCandidates, collectSprintFacts } from './insights.js';

export const aiRouter = Router();

// Latest summary per task, kept in memory. Model calls are slow and cost money;
// losing this cache on restart only costs one extra call per task.
const summaries = new Map();

// Model calls are slow and cost money; keep one person from hammering them.
aiRouter.use(rateLimit({ name: 'ai', limit: 20, windowMs: 60_000 }));

aiRouter.post('/tasks/:taskId/summary', async (req, res) => {
  const { task } = await authorizeTask(req.userId, req.params.taskId, 'ai:use');
  const comments = await CommentModel.find({ task: task._id }).sort({ createdAt: 1 }).populate('author', 'name').lean();

  // Reuse the last summary while the thread hasn't changed: a new comment or an
  // edit to the task changes the version and misses the cache.
  const lastComment = comments.at(-1)?.createdAt.getTime() ?? 0;
  const version = `${comments.length}:${lastComment}:${task.updatedAt.getTime()}`;
  const cached = summaries.get(String(task._id));
  if (cached?.version === version) return void res.json(cached.result);

  const board = await BoardModel.findById(task.board).lean();
  const summary = await summarizeThread({
    key: `${board.key}-${task.number}`,
    title: task.title,
    description: task.description,
    status: task.status,
    comments: comments.map((c) => ({
      author: c.author.name,
      body: c.body,
      createdAt: c.createdAt,
    })),
  });

  const result = { summary, commentCount: comments.length, generatedAt: new Date() };
  summaries.set(String(task._id), { version, result });
  res.json(result);
});

const reportSchema = z.object({ days: z.number().int().min(7).max(28).default(14) });

aiRouter.post('/boards/:boardId/sprint-report', async (req, res) => {
  const { board } = await authorizeBoard(req.userId, req.params.boardId, 'ai:use');
  const { days } = reportSchema.parse(req.body ?? {});

  const facts = await collectSprintFacts(board, days);
  const narrative = await writeSprintReport(facts);

  res.json({
    days,
    stats: {
      shipped: facts.shipped.length,
      blocked: facts.blocked.length,
      inProgress: facts.inProgress.length,
      created: facts.createdCount,
    },
    velocity: facts.velocity,
    narrative,
    generatedAt: new Date(),
  });
});

aiRouter.post('/boards/:boardId/prioritize', async (req, res) => {
  const { board } = await authorizeBoard(req.userId, req.params.boardId, 'ai:use');
  const candidates = await collectPriorityCandidates(board);

  if (candidates.length === 0) {
    return void res.json({ overview: 'Nothing open on this board.', suggestions: [] });
  }

  const result = await suggestPriorities(board.name, candidates);
  const byId = new Map(candidates.map((c) => [c.taskId, c]));

  // Drop anything the model made up or that wouldn't actually change.
  const suggestions = result.suggestions
    .filter((s) => byId.has(s.taskId) && byId.get(s.taskId).priority !== s.priority)
    .map((s) => ({ ...s, key: byId.get(s.taskId).key, currentPriority: byId.get(s.taskId).priority }));

  res.json({ overview: result.overview, suggestions });
});
