import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Include AI-pipeline tests and specific API route test
    include: [
      'lib/ai-pipeline/tests/**/*.ts',
      'app/api/generate-logo/route.test.ts',
      'lib/animation/tests/**/*.ts',
    ],
    environment: 'jsdom', // enable DOM APIs for animation and SMIL provider tests
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**'], // exclude E2E Playwright tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
