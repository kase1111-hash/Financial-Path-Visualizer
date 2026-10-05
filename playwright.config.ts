import { defineConfig, devices } from '@playwright/test';

/** Dev server URL including Vite's `base` path ('/Financial-Path-Visualizer/'). */
const APP_URL = 'http://localhost:5173/Financial-Path-Visualizer/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // Must match `base` in vite.config.ts. Tests navigate with relative URLs
    // (page.goto('./')) so they resolve under this path; '/' would escape it.
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

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
    /* Mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run dev server before tests */
  webServer: {
    // --strictPort: fail instead of silently moving to another port that
    // baseURL doesn't point at.
    command: 'npm run dev -- --port 5173 --strictPort',
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
