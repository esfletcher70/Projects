// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * End-to-end tests for Small App Tools.
 *
 * Cloudflare Pages Functions serve the weather API proxy. Playwright starts
 * a local Pages dev server via wrangler. A dummy API key is used because the
 * weather spec mocks the /api/* endpoints so no real network/API key is needed.
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8788',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx wrangler pages dev public --local --port=8788',
    url: 'http://127.0.0.1:8788/',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
