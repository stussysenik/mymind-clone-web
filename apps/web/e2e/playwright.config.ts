import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3737',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'], // Uses chromium, 393px width
      },
    },
    {
      name: 'Mobile Chrome Narrow',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  // Don't start a server - assume it's already running
  webServer: undefined,
});
