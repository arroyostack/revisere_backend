import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    include: ['tests/unit/**/*.test.ts'],
    env: loadEnv('test', process.cwd(), ''),
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage/unit',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', '**/*.module.ts', '**/*.controller.ts'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});