// Resets the database and loads a demo workspace with a few weeks of history,
// so the board, sprint report and velocity chart have something real to show.
// Everyone's password is "pulseboard".

import bcrypt from 'bcryptjs';
import mongoose, { Types } from 'mongoose';
import { config } from '../config.js';
import { connectDb } from '../lib/db.js';
import { UserModel } from '../features/auth/user.model.js';
import { colorFor } from '../features/auth/colors.js';
import { WorkspaceModel } from '../features/workspaces/workspace.model.js';
import { BoardModel } from '../features/boards/board.model.js';
import { TaskModel } from '../features/tasks/task.model.js';
import { CommentModel } from '../features/comments/comment.model.js';
import { ActivityModel } from '../features/activity/activity.model.js';

if (config.NODE_ENV === 'production') {
  console.error('Refusing to seed a production database.');
  process.exit(1);
}

const DAY = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

const people = [
  { name: 'Maya Chen', username: 'maya', email: 'maya@northwind.dev' },
  { name: 'Daniel Okafor', username: 'daniel', email: 'daniel@northwind.dev' },
  { name: 'Priya Raman', username: 'priya', email: 'priya@northwind.dev' },
  { name: 'Lucas Meyer', username: 'lucas', email: 'lucas@northwind.dev' },
  { name: 'Sofia Alvarez', username: 'sofia', email: 'sofia@northwind.dev' },
  { name: 'Jonah Kim', username: 'jonah', email: 'jonah@northwind.dev' },
];

const platformTasks = [
  {
    title: 'Move sessions to a replicated database cluster',
    status: 'in_progress',
    priority: 'high',
    assignee: 1,
    labels: ['infra'],
    due: 3,
    description:
      'Our single database primary is the last non-redundant piece. Move sessions to a 3-node replicated cluster.',
  },
  {
    title: 'Rotate refresh tokens on every use',
    status: 'in_review',
    priority: 'high',
    assignee: 2,
    labels: ['auth', 'security'],
    due: 1,
  },
  {
    title: 'Webhook retries with exponential backoff',
    status: 'todo',
    priority: 'medium',
    assignee: 3,
    labels: ['api'],
    due: 9,
  },
  {
    title: 'p95 latency regression on /boards/:id',
    status: 'blocked',
    priority: 'urgent',
    assignee: 1,
    labels: ['perf', 'bug'],
    due: -1,
    description:
      'Board reads went from 40ms to 380ms p95 after the members populate change. Blocked on the cluster migration for the fix.',
  },
  { title: 'Audit log export (CSV)', status: 'backlog', priority: 'low', labels: ['api'] },
  {
    title: 'Rate limit the public API per token',
    status: 'done',
    priority: 'high',
    assignee: 2,
    labels: ['api', 'security'],
    doneAgo: 3,
  },
  { title: 'Upgrade to Node 22 LTS', status: 'done', priority: 'medium', assignee: 3, labels: ['infra'], doneAgo: 5 },
  {
    title: 'Signed upload URLs for attachments',
    status: 'done',
    priority: 'high',
    assignee: 4,
    labels: ['api'],
    doneAgo: 8,
  },
  {
    title: 'Fix duplicate emails on task reassignment',
    status: 'done',
    priority: 'medium',
    assignee: 4,
    labels: ['bug'],
    doneAgo: 10,
  },
  {
    title: 'OpenAPI spec for v1 endpoints',
    status: 'done',
    priority: 'medium',
    assignee: 2,
    labels: ['api', 'docs'],
    doneAgo: 12,
  },
  {
    title: 'Presence indicators across instances',
    status: 'done',
    priority: 'high',
    assignee: 1,
    labels: ['realtime'],
    doneAgo: 15,
  },
  {
    title: 'Structured logging with request ids',
    status: 'done',
    priority: 'low',
    assignee: 3,
    labels: ['infra'],
    doneAgo: 18,
  },
  {
    title: 'Reconnect sockets after network drops',
    status: 'done',
    priority: 'high',
    assignee: 1,
    labels: ['realtime', 'infra'],
    doneAgo: 22,
  },
  {
    title: 'Workspace roles: owner / admin / member',
    status: 'done',
    priority: 'high',
    assignee: 2,
    labels: ['auth'],
    doneAgo: 26,
  },
  {
    title: 'Seed script for local development',
    status: 'done',
    priority: 'low',
    assignee: 5,
    labels: ['dx'],
    doneAgo: 30,
  },
  {
    title: 'Health checks for the load balancer',
    status: 'done',
    priority: 'medium',
    assignee: 3,
    labels: ['infra'],
    doneAgo: 33,
  },
  {
    title: 'Speed up board loading',
    status: 'todo',
    priority: 'high',
    assignee: 1,
    labels: ['perf'],
    due: 6,
    dependsOn: [0],
  },
  { title: 'SSO with Google Workspace', status: 'backlog', priority: 'medium', labels: ['auth'] },
  { title: 'Per-board notification settings', status: 'backlog', priority: 'low', labels: ['notifications'] },
  {
    title: 'Due-date reminders at 9am local time',
    status: 'todo',
    priority: 'medium',
    assignee: 4,
    labels: ['notifications'],
    due: 12,
  },
  {
    title: 'Flaky test: socket fan-out under load',
    status: 'in_progress',
    priority: 'medium',
    assignee: 5,
    labels: ['bug', 'realtime'],
    due: 2,
  },
  { title: 'Archive boards instead of deleting', status: 'backlog', priority: 'none', labels: ['product'] },
  {
    title: 'Backfill activity log for imported boards',
    status: 'blocked',
    priority: 'medium',
    assignee: 3,
    labels: ['api'],
    due: 4,
    description: 'Waiting on the data team to confirm which Trello export format we support.',
  },
];

const mobileTasks = [
  {
    title: 'Offline mode for task list',
    status: 'in_progress',
    priority: 'high',
    assignee: 4,
    labels: ['ios', 'android'],
    due: 8,
  },
  {
    title: 'Push notifications for mentions',
    status: 'todo',
    priority: 'medium',
    assignee: 5,
    labels: ['notifications'],
    due: 14,
  },
  { title: 'Dark mode parity with web', status: 'in_review', priority: 'low', assignee: 4, labels: ['design'] },
  {
    title: 'Crash on Android 12 when opening attachments',
    status: 'done',
    priority: 'urgent',
    assignee: 5,
    labels: ['bug', 'android'],
    doneAgo: 4,
  },
  { title: 'Board switcher gesture', status: 'backlog', priority: 'low', labels: ['design'] },
  { title: 'App Store screenshots', status: 'done', priority: 'low', assignee: 0, labels: ['launch'], doneAgo: 9 },
];

const growthTasks = [
  {
    title: 'Onboarding checklist experiment',
    status: 'in_progress',
    priority: 'medium',
    assignee: 0,
    labels: ['experiment'],
    due: 5,
  },
  { title: 'Template gallery for new boards', status: 'todo', priority: 'medium', assignee: 3, labels: ['product'] },
  { title: 'Weekly digest email', status: 'backlog', priority: 'low', labels: ['notifications'] },
  {
    title: 'Referral credit for team invites',
    status: 'done',
    priority: 'medium',
    assignee: 0,
    labels: ['experiment'],
    doneAgo: 11,
  },
];

const sessionThread = [
  [1, 'Starting on this. Plan: stand up a 3-node cluster in staging, dual-write sessions for a day, then flip reads.'],
  [
    2,
    'Heads up that sign-in reads sessions on every request. If the cluster adds latency there, everyone will feel it.',
  ],
  [
    1,
    "Good point. I'll add an index on the session token and measure sign-in latency before and after the flip.",
  ],
  [0, "What's the rollback story if latency gets worse after the flip?"],
  [
    1,
    "Reads go through a flag. Flipping it back points us at the old primary, which keeps receiving writes until we're confident.",
  ],
  [3, 'Staging numbers look fine: p95 on session reads went from 1.8ms to 2.1ms. Well within budget.'],
  [
    2,
    "Refresh token rotation (PLAT-2) touches the same code path. Can we land that first so we're not rebasing twice?",
  ],
  [1, "Agreed. I'll hold the flip until PLAT-2 merges; dual-writes can keep running in the meantime."],
  [0, "Sounds good. Daniel owns the flip once PLAT-2 is in, targeting Thursday. Let's not do it on a Friday."],
];

async function seedBoard(workspace, name, key, description, tasks, users) {
  const board = await BoardModel.create({ workspace, name, key, description, taskCounter: tasks.length });
  const ids = tasks.map(() => new Types.ObjectId());
  const positions = new Map();
  const activity = [];

  const docs = tasks.map((t, i) => {
    const position = (positions.get(t.status) ?? 0) + 1024;
    positions.set(t.status, position);

    const assignee = t.assignee === undefined ? null : users[t.assignee]._id;
    const creator = users[t.assignee ?? 0]._id;
    const completedAt = t.doneAgo !== undefined ? daysAgo(t.doneAgo) : null;
    const createdAt = daysAgo((t.doneAgo ?? 0) + 6 + (i % 5));
    const startedAt = ['in_progress', 'blocked', 'in_review', 'done'].includes(t.status)
      ? new Date(createdAt.getTime() + 2 * DAY)
      : null;

    const log = (type, at, data = {}) =>
      activity.push({ board: board._id, task: ids[i], actor: assignee ?? creator, type, data, createdAt: at });

    log('task.created', createdAt);
    if (startedAt) log('task.moved', startedAt, { from: 'todo', to: 'in_progress' });
    if (t.status === 'blocked') log('task.moved', daysAgo(2), { from: 'in_progress', to: 'blocked' });
    if (t.status === 'in_review' || completedAt) {
      log('task.moved', completedAt ? new Date(completedAt.getTime() - DAY) : daysAgo(1), {
        from: 'in_progress',
        to: 'in_review',
      });
    }
    if (completedAt) log('task.moved', completedAt, { from: 'in_review', to: 'done' });

    return {
      _id: ids[i],
      board: board._id,
      workspace,
      number: i + 1,
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      assignee,
      labels: t.labels ?? [],
      dueDate: t.due === undefined ? null : daysFromNow(t.due),
      dependsOn: (t.dependsOn ?? []).map((d) => ids[d]),
      position,
      createdBy: creator,
      startedAt,
      completedAt,
      createdAt,
      updatedAt: completedAt ?? daysAgo(i % 4),
    };
  });

  await TaskModel.insertMany(docs);
  await ActivityModel.insertMany(activity);
  return { board, taskIds: ids };
}

async function main() {
  await connectDb();
  await mongoose.connection.dropDatabase();

  const passwordHash = await bcrypt.hash('pulseboard', 10);
  const users = await UserModel.insertMany(
    people.map((p) => ({ ...p, passwordHash, color: colorFor(p.email), emailVerifiedAt: new Date() })),
  );

  const workspace = await WorkspaceModel.create({
    name: 'Northwind Labs',
    members: users.map((u, i) => ({ user: u._id, role: i === 0 ? 'owner' : i === 1 ? 'admin' : 'member' })),
  });
  await WorkspaceModel.create({ name: 'Maya — personal', members: [{ user: users[0]._id, role: 'owner' }] });

  const platform = await seedBoard(
    workspace._id,
    'Platform',
    'PLAT',
    'API, infrastructure and realtime.',
    platformTasks,
    users,
  );
  await seedBoard(workspace._id, 'Mobile', 'MOB', 'iOS and Android apps.', mobileTasks, users);
  await seedBoard(workspace._id, 'Growth', 'GRO', 'Activation and retention experiments.', growthTasks, users);

  const threadTask = platform.taskIds[0];
  await CommentModel.insertMany(
    sessionThread.map(([author, body], i) => ({
      task: threadTask,
      board: platform.board._id,
      author: users[author]._id,
      body,
      createdAt: daysAgo(4 - i * 0.4),
    })),
  );
  await CommentModel.create({
    task: platform.taskIds[3],
    board: platform.board._id,
    author: users[1]._id,
    body: 'Profiled it: the populate on members runs once per task. Fix is in PLAT-17 but that needs the cluster first.',
  });

  console.log(
    `Seeded ${users.length} users, 3 boards, ${platformTasks.length + mobileTasks.length + growthTasks.length} tasks.`,
  );
  console.log('Sign in as maya (owner), daniel (admin) or priya (member), or use their @northwind.dev emails.');
  console.log('Password for everyone: pulseboard');
}

await main();
await mongoose.disconnect();
