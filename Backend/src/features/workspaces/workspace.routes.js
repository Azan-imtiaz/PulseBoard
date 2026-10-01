import { Router } from 'express';
import { z } from 'zod';
import { HttpError, forbidden, notFound } from '../../lib/errors.js';
import { evictFromBoards } from '../../realtime/emit.js';
import { UserModel, publicUser } from '../auth/user.model.js';
import { BoardModel } from '../boards/board.model.js';
import { deleteBoards } from '../boards/board.service.js';
import { WorkspaceModel } from './workspace.model.js';
import { authorize } from './access.js';
import { canChangeRole, canRemoveMember } from './permissions.js';

export const workspaceRouter = Router();

const nameSchema = z.object({ name: z.string().trim().min(1).max(80) });
const addMemberSchema = z.object({ email: z.email(), role: z.enum(['admin', 'member']).default('member') });
const changeRoleSchema = z.object({ role: z.enum(['admin', 'member']) });

workspaceRouter.get('/', async (req, res) => {
  const workspaces = await WorkspaceModel.find({ 'members.user': req.userId }).sort({ createdAt: 1 }).lean();
  res.json({
    workspaces: workspaces.map((w) => ({
      id: String(w._id),
      name: w.name,
      role: w.members.find((m) => String(m.user) === req.userId).role,
      memberCount: w.members.length,
    })),
  });
});

workspaceRouter.post('/', async (req, res) => {
  const { name } = nameSchema.parse(req.body);
  const workspace = await WorkspaceModel.create({ name, members: [{ user: req.userId, role: 'owner' }] });
  res.status(201).json({ workspace: { id: String(workspace._id), name, role: 'owner', memberCount: 1 } });
});

workspaceRouter.patch('/:workspaceId', async (req, res) => {
  const role = await authorize(req.userId, req.params.workspaceId, 'workspace:update');
  const { name } = nameSchema.parse(req.body);
  const workspace = await WorkspaceModel.findByIdAndUpdate(req.params.workspaceId, { name }, { new: true });
  res.json({ workspace: { id: String(workspace._id), name: workspace.name, role } });
});

workspaceRouter.delete('/:workspaceId', async (req, res) => {
  const { workspaceId } = req.params;
  await authorize(req.userId, workspaceId, 'workspace:delete');

  const boardIds = await BoardModel.find({ workspace: workspaceId }).distinct('_id');
  await deleteBoards(boardIds);
  await WorkspaceModel.deleteOne({ _id: workspaceId });
  res.status(204).end();
});

workspaceRouter.get('/:workspaceId/members', async (req, res) => {
  await authorize(req.userId, req.params.workspaceId, 'workspace:read');
  const workspace = await WorkspaceModel.findById(req.params.workspaceId).populate('members.user').lean();

  res.json({
    members: workspace.members.map((m) => ({
      ...publicUser(m.user),
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  });
});

workspaceRouter.post('/:workspaceId/members', async (req, res) => {
  const { workspaceId } = req.params;
  const actorRole = await authorize(req.userId, workspaceId, 'members:manage');
  const input = addMemberSchema.parse(req.body);

  if (!canChangeRole(actorRole, 'member', input.role)) throw forbidden(`You can't add people as ${input.role}`);

  const user = await UserModel.findOne({ email: input.email, emailVerifiedAt: { $ne: null } });
  if (!user) throw new HttpError(404, 'No PulseBoard account uses that email yet', 'user_not_found');

  const updated = await WorkspaceModel.updateOne(
    { _id: workspaceId, 'members.user': { $ne: user._id } },
    { $push: { members: { user: user._id, role: input.role } } },
  );
  if (updated.modifiedCount === 0) throw new HttpError(409, 'Already a member of this workspace', 'already_member');

  res.status(201).json({ member: { ...publicUser(user), role: input.role, joinedAt: new Date() } });
});

async function findMember(workspaceId, userId) {
  const workspace = await WorkspaceModel.findById(workspaceId);
  const member = workspace?.members.find((m) => String(m.user) === userId);
  if (!workspace || !member) throw notFound('Member');
  return { workspace, member };
}

workspaceRouter.patch('/:workspaceId/members/:userId', async (req, res) => {
  const { workspaceId, userId } = req.params;
  const actorRole = await authorize(req.userId, workspaceId, 'members:manage');
  const { role } = changeRoleSchema.parse(req.body);
  const { workspace, member } = await findMember(workspaceId, userId);

  if (!canChangeRole(actorRole, member.role, role)) throw forbidden(`You can't change this member's role`);

  member.role = role;
  await workspace.save();
  res.json({ userId, role });
});

workspaceRouter.delete('/:workspaceId/members/:userId', async (req, res) => {
  const { workspaceId, userId } = req.params;
  const actorRole = await authorize(req.userId, workspaceId, 'workspace:read');
  const { workspace, member } = await findMember(workspaceId, userId);

  if (!canRemoveMember(actorRole, member.role, userId === req.userId)) throw forbidden(`You can't remove this member`);

  workspace.members.splice(workspace.members.indexOf(member), 1);
  await workspace.save();

  // Their open boards stop receiving updates now, not at their next reconnect.
  const boardIds = await BoardModel.find({ workspace: workspaceId }).distinct('_id');
  await evictFromBoards(boardIds, userId);
  res.status(204).end();
});
