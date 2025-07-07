import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory for test artifacts (screenshots, videos, etc.)
  outputDir: 'test-results/',

  // Test timeout
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Test directory pattern
  testDir: './e2e',

  // Run all tests in parallel
  fullyParallel: true,

  // Fail on console errors
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Number of workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [['html', { open: 'never' }], ['list']],

  // Use Playwright's built-in web server
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Configure projects for browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Axe accessibility tests setup
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    },
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        screenshot: 'on',
        video: 'on-first-retry',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
