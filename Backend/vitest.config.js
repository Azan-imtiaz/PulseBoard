import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The API suites share one test database, so run files one at a time.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test-secret-that-is-long-enough-123',
      MONGO_URL: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/pulseboard_test',
      // The suites sign in far more often than a person would.
      AUTH_RATE_LIMIT: '1000',
    },
  },
});
