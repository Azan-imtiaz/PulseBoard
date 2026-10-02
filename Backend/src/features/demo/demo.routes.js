import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/errors.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { UserModel } from '../auth/user.model.js';
import { startSession } from '../auth/session.js';
import { personas } from './demoData.js';

export const demoRouter = Router();

const limiter = rateLimit({ name: 'demo', limit: 30, windowMs: 60_000, key: (req) => req.ip ?? 'unknown' });
const signInSchema = z.object({ role: z.enum(personas.map((p) => p.role)) });

async function demoUsers() {
  const users = await UserModel.find({ username: { $in: personas.map((p) => p.username) }, isDemo: true }).lean();
  return new Map(users.map((u) => [u.username, u]));
}

// Who you can sign in as. `available` is false until the demo has been seeded.
demoRouter.get('/', limiter, async (_req, res) => {
  const users = await demoUsers();
  res.json({
    available: users.size === personas.length,
    personas: personas
      .filter((p) => users.has(p.username))
      .map((p) => {
        const user = users.get(p.username);
        return { ...p, name: user.name, color: user.color };
      }),
  });
});

demoRouter.post('/sign-in', limiter, async (req, res) => {
  const { role } = signInSchema.parse(req.body);
  const persona = personas.find((p) => p.role === role);
  const user = await UserModel.findOne({ username: persona.username, isDemo: true });
  if (!user) throw new HttpError(404, "The demo isn't set up on this server", 'demo_unavailable');
  res.json(await startSession(res, user));
});
