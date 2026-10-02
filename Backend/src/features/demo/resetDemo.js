import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { ActivityModel } from '../activity/activity.model.js';
import { colorFor } from '../auth/colors.js';
import { UserModel } from '../auth/user.model.js';
import { BoardModel } from '../boards/board.model.js';
import { deleteBoards } from '../boards/board.service.js';
import { CommentModel } from '../comments/comment.model.js';
import { TaskModel } from '../tasks/task.model.js';
import { WorkspaceModel } from '../workspaces/workspace.model.js';
import { DEMO_PASSWORD, DEMO_WORKSPACE, boards, people, roles, threads } from './demoData.js';

const DAY = 86_400_000;

// Rebuilds the demo workspace from scratch. Only demo data is touched, so this is
// safe to run against a live database. Demo accounts are updated in place rather
// than recreated, so visitors who are signed in keep their session.
export async function resetDemo(now = Date.now()) {
  const users = await upsertDemoUsers();
  const userIds = users.map((u) => u._id);

  const oldWorkspaces = await WorkspaceModel.find({ 'members.user': { $in: userIds } }).distinct('_id');
  await deleteBoards(await BoardModel.find({ workspace: { $in: oldWorkspaces } }).distinct('_id'));
  await WorkspaceModel.deleteMany({ _id: { $in: oldWorkspaces } });

  const workspace = await WorkspaceModel.create({
    name: DEMO_WORKSPACE,
    members: users.map((u, i) => ({ user: u._id, role: roles[i] ?? 'member', joinedAt: new Date(now - 40 * DAY) })),
  });

  const taskIds = {};
  for (const board of boards) {
    taskIds[board.key] = await seedBoard(workspace._id, board, users, now);
  }

  for (const [boardKey, index, comments] of threads) {
    const board = await BoardModel.findOne({ workspace: workspace._id, key: boardKey });
    await CommentModel.insertMany(
      comments.map(([author, body], i) => ({
        task: taskIds[boardKey][index],
        board: board._id,
        author: users[author]._id,
        body,
        mentions: mentionsIn(body, users),
        createdAt: new Date(now - (4 - i * 0.45) * DAY),
      })),
    );
  }

  return { workspace, users };
}

async function upsertDemoUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];

  for (const person of people) {
    const existing = await UserModel.findOne({ $or: [{ username: person.username }, { email: person.email }] });
    // Never take over a real person's account that happens to use a demo username.
    if (existing && !existing.isDemo) {
      throw new Error(`Can't reset the demo: @${existing.username} belongs to a real account`);
    }

    const fields = {
      ...person,
      passwordHash,
      color: colorFor(person.email),
      isDemo: true,
      emailVerifiedAt: existing?.emailVerifiedAt ?? new Date(),
    };
    users.push(
      existing ? await UserModel.findByIdAndUpdate(existing._id, fields, { new: true }) : await UserModel.create(fields),
    );
  }
  return users;
}

async function seedBoard(workspaceId, { name, key, description, tasks }, users, now) {
  const daysAgo = (n) => new Date(now - n * DAY);
  const board = await BoardModel.create({ workspace: workspaceId, name, key, description, taskCounter: tasks.length });
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

    // The activity log is what the sprint report and velocity chart read from.
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
      workspace: workspaceId,
      number: i + 1,
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      assignee,
      labels: t.labels ?? [],
      dueDate: t.due === undefined ? null : new Date(now + t.due * DAY),
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
  return ids;
}

function mentionsIn(body, users) {
  const names = [...body.matchAll(/@([a-z0-9._]+[a-z0-9])/gi)].map((m) => m[1].toLowerCase());
  return users.filter((u) => names.includes(u.username)).map((u) => u._id);
}
