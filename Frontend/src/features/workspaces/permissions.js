// Mirrors the server's rules so the UI only offers what will succeed.
// The server is still the one enforcing them.
const rank = { member: 1, admin: 2, owner: 3 };

export const isAdmin = (role) => !!role && rank[role] >= rank.admin;

export const canManage = (actor, target) => isAdmin(actor) && rank[actor] > rank[target];

export const canAssignRole = (actor, role) => role !== 'owner' && rank[actor] > rank[role];
