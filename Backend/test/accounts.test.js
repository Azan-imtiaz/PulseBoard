import { describe, expect, it } from 'vitest';
import { checkUsernameFormat, toUsername, usernameCandidates } from '../src/features/auth/usernames.js';
import { passwordProblem } from '../src/features/auth/passwords.js';

describe('checkUsernameFormat', () => {
  it('accepts lowercase letters, digits, dots and underscores', () => {
    for (const name of ['maya', 'maya.chen', 'maya_c', 'm4ya', 'abc']) expect(checkUsernameFormat(name)).toBeNull();
  });

  it('rejects bad lengths, characters and edges', () => {
    expect(checkUsernameFormat('ab')).toMatch(/at least 3/);
    expect(checkUsernameFormat('a'.repeat(21))).toMatch(/at most 20/);
    for (const name of ['Maya', 'maya chen', '.maya', 'maya.', 'maya..chen', 'maya._chen', 'maya-chen']) {
      expect(checkUsernameFormat(name)).not.toBeNull();
    }
  });

  it('keeps reserved names for the system', () => {
    expect(checkUsernameFormat('admin')).toMatch(/reserved/);
  });
});

describe('toUsername', () => {
  it('turns free text into a valid handle', () => {
    expect(toUsername('Maya Chen')).toBe('maya.chen');
    expect(toUsername('  José  Núñez!! ')).toBe('jose.nunez');
    expect(toUsername('__weird..name__')).toBe('weird.name');
  });
});

describe('usernameCandidates', () => {
  const fixedRandom = () => 0.5;

  it('starts with name-based options and falls back to numbered ones', () => {
    const candidates = usernameCandidates('maya', 'Maya Chen', fixedRandom);
    expect(candidates.slice(0, 5)).toEqual(['maya', 'maya.chen', 'mayachen', 'maya_c', 'mchen']);
    expect(candidates).toContain('maya505');
  });

  it('only ever suggests valid usernames', () => {
    for (const c of usernameCandidates('A!!', 'X', fixedRandom)) expect(checkUsernameFormat(c)).toBeNull();
  });

  it('suggests nothing when there is nothing to build from', () => {
    expect(usernameCandidates('', '')).toEqual([]);
  });
});

describe('passwordProblem', () => {
  it('accepts a reasonable password', () => {
    expect(passwordProblem('correct horse battery', { email: 'maya@x.dev', username: 'maya' })).toBeNull();
  });

  it('rejects short, common, repeated and personal passwords', () => {
    expect(passwordProblem('short')).toMatch(/at least 8/);
    expect(passwordProblem('Password123')).toMatch(/too common/);
    expect(passwordProblem('aaaaaaaaaa')).toMatch(/repeated/);
    expect(passwordProblem('maya.chen2026', { username: 'maya.chen' })).toMatch(/username/);
    expect(passwordProblem('mayachen!!99', { email: 'mayachen@x.dev' })).toMatch(/email/);
  });
});
