// Resets only the demo workspace and accounts, leaving real users alone. Safe to
// run in production, e.g. from a scheduled job.

import mongoose from 'mongoose';
import { connectDb } from '../lib/db.js';
import { resetDemo } from '../features/demo/resetDemo.js';

await connectDb();
const { users } = await resetDemo();
console.log(`Demo reset: ${users.length} accounts, workspace rebuilt.`);
await mongoose.disconnect();
