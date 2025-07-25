import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../tests', // point to your test files
  retries: 0,
  timeout: 30 * 1000,
  reporter: [
    ['html', { outputFolder: '../output/html-report', open: 'never' }],
    ['list'], // Optional CLI-friendly output
  ],
  use: {
    trace: 'on-first-retry',                   // Collect trace on first retry
    video: 'retain-on-failure',                // Keep videos for failed tests
    screenshot: 'only-on-failure',             // Take screenshots on failures
  },
  outputDir: '../output/artifacts',            // Where videos/screenshots/traces go
});
