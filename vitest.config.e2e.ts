import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    include: ['tests/e2e/**/*.test.ts'],
    env: loadEnv('test', process.cwd(), ''),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
