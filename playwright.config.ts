import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authDir = path.join(__dirname, 'playwright/.auth');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    // 1. Setup Project: Generates storageState for each role via real login
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 2. Default project for public / unauthenticated tests (UI smoke, registration, login attacks)
    {
      name: 'chromium',
      testIgnore: [/.*\.setup\.ts/],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // 3. Stored Auth State Projects per role
    {
      name: 'role-institution',
      dependencies: ['setup'],
      testMatch: /.*\/institution\/.*spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'institution.json'),
      },
    },
    {
      name: 'role-regional',
      dependencies: ['setup'],
      testMatch: /.*\/regional\/.*spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'regional_officer.json'),
      },
    },
    {
      name: 'role-scrutiny',
      dependencies: ['setup'],
      testMatch: /.*\/scrutiny\/.*spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'scrutiny_officer.json'),
      },
    },
    {
      name: 'role-admin',
      dependencies: ['setup'],
      testMatch: /.*\/admin\/.*spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'system_admin.json'),
      },
    },
  ],
});
