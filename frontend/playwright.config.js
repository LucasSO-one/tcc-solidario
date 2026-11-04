import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', timeout: 180000, expect: { timeout: 20000 }, workers: 1,
  reporter: [['list']], use: { baseURL: 'http://127.0.0.1:55187', headless: true },
  webServer: { command: 'node ../tests/browser-server.mjs', url: 'http://127.0.0.1:55187/health', reuseExistingServer: false, timeout: 120000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium',
    ...(process.env.VITTAFLOW_TEST_CHROME ? { launchOptions: { executablePath: process.env.VITTAFLOW_TEST_CHROME } } : {}) } }],
});
