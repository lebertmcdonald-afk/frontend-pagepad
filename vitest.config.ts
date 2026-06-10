import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/server/test/**/*.test.ts'],
    environment: 'node',
  },
});
