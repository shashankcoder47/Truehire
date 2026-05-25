// @ts-check
import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const envFile = path.resolve(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const frontendURL = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
const normalizeApiBaseURL = (value) => {
  const rawValue = value || 'http://127.0.0.1:5000/api';
  const trimmed = rawValue.trim().replace(/\/+$/, '');
  const withApi = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  return `${withApi}/`;
};
const backendURL = normalizeApiBaseURL(process.env.API_BASE_URL);
const reporters = [
  ['list'],
  ['html', { outputFolder: 'qa/reports/playwright-html', open: 'never' }],
  ['json', { outputFile: 'qa/reports/playwright-json/results.json' }],
  ['junit', { outputFile: 'qa/reports/junit/results.xml' }]
];

try {
  require.resolve('allure-playwright');
  reporters.push(['allure-playwright', { outputFolder: 'qa/reports/allure-results' }]);
} catch {
  console.warn('allure-playwright is not installed; skipping Allure reporter.');
}

export default defineConfig({
  testDir: './qa/tests',
  outputDir: './qa/reports/test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  globalSetup: './qa/config/global-setup.js',
  globalTeardown: './qa/config/global-teardown.js',
  reporter: reporters,
  use: {
    baseURL: frontendURL,
    extraHTTPHeaders: {
      'x-qa-suite': 'truehire-playwright'
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  metadata: {
    apiBaseURL: backendURL
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/
    },
    {
      name: 'chromium',
      testMatch: /qa\/tests\/ui\/.*\.spec\.js/,
      testIgnore: /.*\.setup\.js/,
      use: { ...devices['Desktop Chrome'], storageState: 'qa/.auth/candidate.json' },
      dependencies: ['setup']
    },
    {
      name: 'firefox',
      testMatch: /qa\/tests\/ui\/.*\.spec\.js/,
      testIgnore: /.*\.setup\.js/,
      use: { ...devices['Desktop Firefox'], storageState: 'qa/.auth/candidate.json' },
      dependencies: ['setup']
    },
    {
      name: 'webkit',
      testMatch: /qa\/tests\/ui\/.*\.spec\.js/,
      testIgnore: /.*\.setup\.js/,
      use: { ...devices['Desktop Safari'], storageState: 'qa/.auth/candidate.json' },
      dependencies: ['setup']
    },
    {
      name: 'api',
      testMatch: /qa\/tests\/(api|security)\/.*\.spec\.js/,
      testIgnore: /.*\.setup\.js/,
      use: { baseURL: backendURL }
    }
  ],
  webServer: process.env.PW_SKIP_WEB_SERVER === 'true'
    ? undefined
    : [
        {
          command: 'npm run dev',
          cwd: './Truehire/frontend',
          url: frontendURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000
        },
        {
          command: 'npm run dev',
          cwd: './Truehire/backend',
          url: backendURL.replace(/\/api\/?$/, '/api/health'),
          reuseExistingServer: !process.env.CI,
          timeout: 120_000
        }
      ]
});
