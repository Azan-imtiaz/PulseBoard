import { createServer } from 'node:http';
import { config } from './config.js';
import { connectDb } from './lib/db.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';
import { createSocketServer } from './realtime/socket.js';
import { startDueSoonReminders } from './features/notifications/dueSoon.js';

await connectDb();

const server = createServer(createApp());
const io = createSocketServer(server);
const reminders = startDueSoonReminders();

server.listen(config.PORT, () => logger.info(`api listening on :${config.PORT}`));

function shutdown() {
  logger.info('shutting down');
  clearInterval(reminders);
  io.close();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
