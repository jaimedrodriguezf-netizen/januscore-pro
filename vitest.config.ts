import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.ts', // Exclude Playwright tests from Vitest
      '**/tests-examples/**',
    ],
  },
});
