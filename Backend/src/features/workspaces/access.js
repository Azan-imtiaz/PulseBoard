import { forbidden, notFound } from '../../lib/errors.js';
import { WorkspaceModel } from './workspace.model.js';
import { can } from './permissions.js';

export async function getRole(workspaceId, userId) {
  const workspace = await WorkspaceModel.findById(workspaceId).select('members').lean();
  const member = workspace?.members.find((m) => String(m.user) === userId);
  return member?.role ?? null;
}

// Non-members get a 404 rather than a 403 so workspace ids can't be probed.
export async function authorize(userId, workspaceId, action) {
  const role = await getRole(workspaceId, userId);
  if (!role) throw notFound('Workspace');
  if (!can(role, action)) throw forbidden();
  return role;
}
