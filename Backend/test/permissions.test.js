import { describe, expect, it } from 'vitest';
import { can, canChangeRole, canDeleteTask, canRemoveMember } from '../src/features/workspaces/permissions.js';

describe('can', () => {
  it('lets every member work on tasks', () => {
    expect(can('member', 'task:write')).toBe(true);
    expect(can('admin', 'task:write')).toBe(true);
    expect(can('owner', 'task:write')).toBe(true);
  });

  it('reserves board management for admins and up', () => {
    expect(can('member', 'board:create')).toBe(false);
    expect(can('member', 'board:delete')).toBe(false);
    expect(can('admin', 'board:delete')).toBe(true);
  });

  it('reserves deleting the workspace for the owner', () => {
    expect(can('admin', 'workspace:delete')).toBe(false);
    expect(can('owner', 'workspace:delete')).toBe(true);
  });
});

describe('canDeleteTask', () => {
  const task = { createdBy: 'author-id' };

  it('lets members delete only their own tasks', () => {
    expect(canDeleteTask('member', 'author-id', task)).toBe(true);
    expect(canDeleteTask('member', 'someone-else', task)).toBe(false);
  });

  it('lets admins delete anyone’s task', () => {
    expect(canDeleteTask('admin', 'someone-else', task)).toBe(true);
  });
});

describe('canChangeRole', () => {
  it('lets owners promote members to admin and demote admins', () => {
    expect(canChangeRole('owner', 'member', 'admin')).toBe(true);
    expect(canChangeRole('owner', 'admin', 'member')).toBe(true);
  });

  it('stops admins from creating other admins', () => {
    expect(canChangeRole('admin', 'member', 'admin')).toBe(false);
  });

  it('stops admins from touching other admins or the owner', () => {
    expect(canChangeRole('admin', 'admin', 'member')).toBe(false);
    expect(canChangeRole('admin', 'owner', 'member')).toBe(false);
  });

  it('never hands out ownership', () => {
    expect(canChangeRole('owner', 'admin', 'owner')).toBe(false);
  });

  it('gives members no say at all', () => {
    expect(canChangeRole('member', 'member', 'member')).toBe(false);
  });
});

describe('canRemoveMember', () => {
  it('lets anyone except the owner leave', () => {
    expect(canRemoveMember('member', 'member', true)).toBe(true);
    expect(canRemoveMember('admin', 'admin', true)).toBe(true);
    expect(canRemoveMember('owner', 'owner', true)).toBe(false);
  });

  it('only lets you remove people ranked below you', () => {
    expect(canRemoveMember('admin', 'member', false)).toBe(true);
    expect(canRemoveMember('admin', 'admin', false)).toBe(false);
    expect(canRemoveMember('member', 'member', false)).toBe(false);
    expect(canRemoveMember('owner', 'admin', false)).toBe(true);
  });
});
