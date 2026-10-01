export const ROLES = ['owner', 'admin', 'member'];

const rank = { member: 1, admin: 2, owner: 3 };

// The minimum role for each action. Anything not listed here needs a
// resource-specific rule below rather than a flat role check.
const minimumRole = {
  'workspace:read': 'member',
  'workspace:update': 'admin',
  'workspace:delete': 'owner',
  'members:manage': 'admin',
  'board:create': 'admin',
  'board:update': 'admin',
  'board:delete': 'admin',
  'task:write': 'member',
  'comment:write': 'member',
  'ai:use': 'member',
};

export function can(role, action) {
  return rank[role] >= rank[minimumRole[action]];
}

// Members can delete what they created; admins and owners can delete anything.
export function canDeleteTask(role, userId, task) {
  return rank[role] >= rank.admin || String(task.createdBy) === userId;
}

// You can only manage people ranked below you, and only hand out roles below your
// own, so admins manage members, owners manage both. Ownership transfer is a
// separate flow (not built yet), so nobody can assign "owner" here.
export function canChangeRole(actorRole, targetRole, nextRole) {
  if (nextRole === 'owner') return false;
  if (!can(actorRole, 'members:manage')) return false;
  return rank[actorRole] > rank[targetRole] && rank[actorRole] > rank[nextRole];
}

export function canRemoveMember(actorRole, targetRole, isSelf) {
  // Anyone but the owner can leave on their own; the owner has to transfer first.
  if (isSelf) return targetRole !== 'owner';
  return can(actorRole, 'members:manage') && rank[actorRole] > rank[targetRole];
}
