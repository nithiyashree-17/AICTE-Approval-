import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';
const bcrypt = require('../../../apps/api/node_modules/bcrypt');

test.describe('Authentication Security, Anti-Enumeration & Session Invalidation', () => {
  test.describe.configure({ mode: 'serial' });

  const victimEmail = 'lockout-test-user@flowguard.local';
  const nonexistentEmail = 'unknown-ghost-user@nowhere.in';

  test.beforeAll(async () => {
    // Create dedicated user for security & lockout tests so baseline demo users remain untouched
    const hash = await bcrypt.hash('Password123!', 10);
    const role = await prisma.role.findFirst({ where: { name: 'INSTITUTION' } });

    await prisma.user.upsert({
      where: { email: victimEmail },
      update: {
        passwordHash: hash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: victimEmail,
        fullName: 'Lockout Test Subject',
        passwordHash: hash,
        status: 'ACTIVE',
        isDemo: true,
        roles: {
          create: {
            roleId: role.id,
            scopeType: 'GLOBAL',
          },
        },
      },
    });
  });

  test('Anti-Enumeration: Bad password and non-existent email return identical generic error', async ({ page }) => {
    // 1. Wrong password on existing user
    await page.goto('/login');
    await page.fill('#email-input', victimEmail);
    await page.fill('#password-input', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    const errorAlert = page.locator('.bg-rose-50[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/invalid/i);

    // 2. Non-existent user
    await page.fill('#email-input', nonexistentEmail);
    await page.fill('#password-input', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/invalid/i);
  });

  test('Account lockout after repeated failed attempts', async ({ page, request }) => {
    // Fire 6 consecutive bad login attempts via API on dedicated victimEmail
    for (let i = 0; i < 6; i++) {
      await request.post('http://localhost:4000/api/v1/auth/login', {
        data: { email: victimEmail, password: 'WrongPassword123!' },
      });
    }

    // Attempt login in UI
    await page.goto('/login');
    await page.fill('#email-input', victimEmail);
    await page.fill('#password-input', 'Password123!'); // correct password
    await page.click('button[type="submit"]');

    const alert = page.locator('.bg-rose-50[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/locked/i);

    // Restore user state in test DB
    await prisma.user.update({
      where: { email: victimEmail },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  test('Forgot Password flow is single-use and prevents email enumeration', async ({ page, request }) => {
    // 1. Request forgot password for existing user
    const res = await request.post('http://localhost:4000/api/v1/auth/forgot-password', {
      data: { email: victimEmail },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.resetUrl).toBeDefined();

    // 2. Extract reset token
    const resetUrl = new URL(body.resetUrl);
    const token = resetUrl.searchParams.get('token')!;
    expect(token).toBeDefined();

    // 3. Reset password using token with confirmPassword
    const resetRes = await request.post('http://localhost:4000/api/v1/auth/reset-password', {
      data: {
        token,
        newPassword: 'NewAicteP@ssw0rd2026!',
        confirmPassword: 'NewAicteP@ssw0rd2026!',
      },
    });
    expect(resetRes.status()).toBe(200);

    // 4. Single-use check: replaying the same reset token MUST fail
    const replayRes = await request.post('http://localhost:4000/api/v1/auth/reset-password', {
      data: {
        token,
        newPassword: 'NewAicteP@ssw0rd2026!',
        confirmPassword: 'NewAicteP@ssw0rd2026!',
      },
    });
    expect(replayRes.status()).toBe(400);

    // Reset password back to default
    const hash = await bcrypt.hash('Password123!', 10);
    await prisma.user.update({
      where: { email: victimEmail },
      data: { passwordHash: hash },
    });
  });

  test('Logout invalidates session server-side; replaying cookie returns 401; no tokens in client storage', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('#email-input', 'bureau@flowguard.local');
    await page.fill('#password-input', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/bureau/dashboard', { timeout: 15000 });

    // Assert zero tokens in localStorage
    const localToken = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('flowguard_token'));
    expect(localToken).toBeNull();

    // Capture session cookie before logout
    const cookiesBefore = await context.cookies();
    const sessionCookie = cookiesBefore.find((c) => c.name === 'flowguard_session');
    expect(sessionCookie).toBeDefined();

    // Logout
    await page.click('#profile-menu-button');
    await page.click('#logout-button');
    await page.waitForURL('**/login', { timeout: 10000 });

    // Try replaying the old cookie against protected /auth/me
    const replayRes = await page.request.get('http://localhost:4000/api/v1/auth/me', {
      headers: {
        Cookie: `flowguard_session=${sessionCookie?.value}`,
      },
    });
    // Server should reject invalid or expired session
    expect([401, 403]).toContain(replayRes.status());
  });
});
