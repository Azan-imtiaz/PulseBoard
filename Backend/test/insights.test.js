import { describe, expect, it } from 'vitest';
import { weeklyCompletions } from '../src/features/ai/insights.js';
import { slidingWindowCount } from '../src/middleware/rateLimit.js';

const now = new Date('2026-03-29T12:00:00Z');
const daysAgo = (n) => new Date(now.getTime() - n * 86_400_000);

describe('weeklyCompletions', () => {
  it('buckets completions into weeks, oldest first', () => {
    const result = weeklyCompletions(
      [
        { task: 'a', at: daysAgo(1) },
        { task: 'b', at: daysAgo(3) },
        { task: 'c', at: daysAgo(9) },
      ],
      3,
      now,
    );
    expect(result.map((w) => w.completed)).toEqual([0, 1, 2]);
  });

  it('counts a task finished twice in one week once', () => {
    const result = weeklyCompletions(
      [
        { task: 'a', at: daysAgo(1) },
        { task: 'a', at: daysAgo(2) },
      ],
      1,
      now,
    );
    expect(result[0].completed).toBe(1);
  });

  it('ignores events outside the range', () => {
    const result = weeklyCompletions([{ task: 'a', at: daysAgo(30) }], 2, now);
    expect(result.every((w) => w.completed === 0)).toBe(true);
  });
});

describe('slidingWindowCount', () => {
  it('weights the previous window by how much of it still overlaps', () => {
    // 25% into the current window, so 75% of the previous window still counts.
    expect(slidingWindowCount(100, 10, 15_000, 60_000)).toBe(85);
  });

  it('ignores the previous window at the very end of the current one', () => {
    expect(slidingWindowCount(100, 10, 60_000, 60_000)).toBe(10);
  });
});
