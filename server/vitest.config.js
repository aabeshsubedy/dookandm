import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 60000,
    setupFiles: ['tests/setup.js'],
    fileParallelism: false,
  },
});
