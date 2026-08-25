// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * End-to-end tests for Small App Tools.
 *
 * All /api/* calls are mocked at the browser level (page.route) in the
 * specs, so a plain static server of public/ is sufficient — no wrangler
 * needed. This avoids the wrangler/workerd instability seen on CI runners.
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8799',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx serve public --listen 8799',
    url: 'http://127.0.0.1:8799/',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
