import { readFileSync } from 'node:fs';
import express, { Router } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { config, isProd } from './config.js';
import { errorHandler, notFound } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { requireAuth } from './middleware/auth.js';
import { rateLimit } from './middleware/rateLimit.js';
import { authRouter } from './features/auth/auth.routes.js';
import { workspaceRouter } from './features/workspaces/workspace.routes.js';
import { boardRouter } from './features/boards/board.routes.js';
import { taskRouter } from './features/tasks/task.routes.js';
import { commentRouter } from './features/comments/comment.routes.js';
import { attachmentRouter } from './features/attachments/attachment.routes.js';
import { aiRouter } from './features/ai/ai.routes.js';
import { contactRouter } from './features/contact/contact.routes.js';
import { demoRouter } from './features/demo/demo.routes.js';

const openapi = YAML.parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'));

export function createApp() {
  const app = express();

  // In production we sit behind exactly one load balancer; trust its X-Forwarded-For
  // so rate limits key on the real client IP.
  if (isProd) app.set('trust proxy', 1);

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => void res.json({ ok: true }));
  app.get('/openapi.json', (_req, res) => void res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'PulseBoard API' }));

  const api = Router();
  api.use('/auth', authRouter);
  api.use('/demo', demoRouter);
  api.use(contactRouter); // public, reachable whether signed in or not

  const authed = Router();
  authed.use(requireAuth, rateLimit({ name: 'api', limit: 300, windowMs: 60_000 }));
  authed.use('/workspaces', workspaceRouter);
  authed.use('/ai', aiRouter);
  authed.use(boardRouter, taskRouter, commentRouter, attachmentRouter);
  api.use(authed);

  app.use('/api/v1', api);
  app.use((_req, _res, next) => next(notFound('Route')));
  app.use(errorHandler);

  return app;
}
