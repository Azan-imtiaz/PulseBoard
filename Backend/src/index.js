import { createServer } from 'node:http';
import { config } from './config.js';
import { connectDb } from './lib/db.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';
import { createSocketServer } from './realtime/socket.js';
import { startDueSoonReminders } from './features/notifications/dueSoon.js';
import { scheduleDemoReset } from './features/demo/schedule.js';

await connectDb();

const server = createServer(createApp());
const io = createSocketServer(server);
const reminders = startDueSoonReminders();
const demoReset = scheduleDemoReset();

server.listen(config.PORT, () => logger.info(`api listening on :${config.PORT}`));

function shutdown() {
  logger.info('shutting down');
  clearInterval(reminders);
  clearInterval(demoReset);
  io.close();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
