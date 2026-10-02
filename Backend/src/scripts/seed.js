// Wipes the local database and loads the demo workspace with a few weeks of
// history, so the board, sprint report and velocity chart have something real to
// show. For a live server use `npm run demo:reset`, which keeps real users.

import mongoose from 'mongoose';
import { config } from '../config.js';
import { connectDb } from '../lib/db.js';
import { DEMO_PASSWORD, boards, personas } from '../features/demo/demoData.js';
import { resetDemo } from '../features/demo/resetDemo.js';

if (config.NODE_ENV === 'production') {
  console.error('Refusing to wipe a production database. Use `npm run demo:reset` instead.');
  process.exit(1);
}

await connectDb();
await mongoose.connection.dropDatabase();
const { users } = await resetDemo();

const taskCount = boards.reduce((sum, b) => sum + b.tasks.length, 0);
console.log(`Seeded ${users.length} users, ${boards.length} boards, ${taskCount} tasks.`);
console.log(`Sign in as ${personas.map((p) => `${p.username} (${p.role})`).join(', ')}.`);
console.log(`Password for everyone: ${DEMO_PASSWORD}`);

await mongoose.disconnect();
