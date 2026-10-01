import { HttpError } from '../lib/errors.js';

// Sliding window counter: keep one counter per fixed window and weight the previous
// window by how much of it still overlaps the sliding one. Two numbers per client
// instead of a log of every request, and no burst-at-the-boundary problem that
// plain fixed windows have. See the README for why we picked this.
export function slidingWindowCount(previous, current, elapsedMs, windowMs) {
  return previous * (1 - elapsedMs / windowMs) + current;
}

// Counters live in this process's memory. That's right for a single server; with
// several instances each would count separately, and the counters should move to a
// shared store such as Redis.
export function rateLimit({ name, limit, windowMs, key = (req) => req.userId ?? req.ip ?? 'unknown' }) {
  const counters = new Map();

  // Forget clients that have been quiet for two windows so the map doesn't grow forever.
  setInterval(() => {
    const staleBefore = Math.floor(Date.now() / windowMs) - 1;
    for (const [id, counter] of counters) if (counter.window < staleBefore) counters.delete(id);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const id = `${name}:${key(req)}`;

    let counter = counters.get(id);
    if (!counter || counter.window < window - 1) counter = { window, current: 0, previous: 0 };
    else if (counter.window === window - 1) counter = { window, current: 0, previous: counter.current };
    counter.current++;
    counters.set(id, counter);

    const elapsed = now % windowMs;
    const count = slidingWindowCount(counter.previous, counter.current, elapsed, windowMs);

    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, Math.floor(limit - count)));

    if (count > limit) {
      res.setHeader('Retry-After', Math.ceil((windowMs - elapsed) / 1000));
      throw new HttpError(429, 'Too many requests, slow down a little', 'rate_limited');
    }
    next();
  };
}
