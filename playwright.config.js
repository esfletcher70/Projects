// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * End-to-end tests for AppHub.
 *
 * The Python server (server/server.py) serves the static pages and proxies
 * OpenWeather API calls. Playwright starts it automatically via `webServer`.
 * A dummy API key is used because the server refuses to boot without one; the
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
    baseURL: 'http://127.0.0.1:8000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'OPENWEATHER_API_KEY=test-key PORT=8000 python3 server/server.py',
    url: 'http://127.0.0.1:8000/Index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
