import { describe, expect, it } from 'vitest';
import { STATUSES, TRANSITIONS, checkTransition, statusTimestamps } from '../src/features/tasks/workflow.js';

const assigned = { assignee: 'user-1' };

describe('checkTransition', () => {
  it('allows staying in the same column (reordering)', () => {
    expect(checkTransition({ status: 'todo', assignee: null }, 'todo')).toEqual({ ok: true });
  });

  it('follows the transition table', () => {
    expect(checkTransition({ status: 'todo', ...assigned }, 'in_progress').ok).toBe(true);
    expect(checkTransition({ status: 'in_review', ...assigned }, 'done').ok).toBe(true);
  });

  it('refuses to skip review', () => {
    const result = checkTransition({ status: 'in_progress', ...assigned }, 'done');
    expect(result).toEqual({ ok: false, reason: "Can't move a task from in progress to done" });
  });

  it('requires an assignee to start work', () => {
    const result = checkTransition({ status: 'todo', assignee: null }, 'in_progress');
    expect(result).toEqual({ ok: false, reason: 'Assign someone before starting this task' });
  });

  it('blocks starting or finishing while dependencies are open', () => {
    expect(checkTransition({ status: 'todo', ...assigned }, 'in_progress', 2)).toEqual({
      ok: false,
      reason: 'Waiting on 2 open dependencies',
    });
    expect(checkTransition({ status: 'in_review', ...assigned }, 'done', 1).ok).toBe(false);
  });

  it('still lets a task with open dependencies move back', () => {
    expect(checkTransition({ status: 'in_progress', ...assigned }, 'blocked', 3).ok).toBe(true);
  });

  it('never strands a task: every status has a way out', () => {
    for (const status of STATUSES) expect(TRANSITIONS[status].length).toBeGreaterThan(0);
  });
});

describe('statusTimestamps', () => {
  const now = new Date('2026-03-01T12:00:00Z');

  it('stamps startedAt when work begins', () => {
    expect(statusTimestamps('todo', 'in_progress', now)).toEqual({ startedAt: now });
  });

  it('keeps the original start when resuming from blocked', () => {
    expect(statusTimestamps('blocked', 'in_progress', now)).toEqual({});
  });

  it('stamps completedAt on done and clears it on reopen', () => {
    expect(statusTimestamps('in_review', 'done', now)).toEqual({ completedAt: now });
    expect(statusTimestamps('done', 'todo', now)).toEqual({ completedAt: null });
  });
});
