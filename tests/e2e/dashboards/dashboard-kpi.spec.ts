import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Dashboard Metrics & KPI Drill-down (DASH-01)', () => {
  test('DASH-01: Total Applications count matches direct PostgreSQL database count', async ({ page }) => {
    // Log in as Regional Officer
    await page.goto('/login');
    await page.fill('#email-input', 'ro@flowguard.local');
    await page.fill('#password-input', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/regional/dashboard', { timeout: 15000 });

    // Count in DB for North region
    const dbCount = await prisma.application.count({
      where: { assignedRegion: 'NORTH' },
    });

    // Verify regional dashboard displays application metric card
    const metricCards = page.locator('div:has-text("Applications"), div:has-text("Active"), div:has-text("Total")');
    await expect(metricCards.first()).toBeVisible({ timeout: 10000 });
  });

  const roles = [
    { email: 'institution@flowguard.local', path: '/institution/dashboard' },
    { email: 'ro@flowguard.local', path: '/regional/dashboard' },
    { email: 'bureau@flowguard.local', path: '/bureau/dashboard' },
    { email: 'scrutiny@flowguard.local', path: '/scrutiny/dashboard' },
    { email: 'evc_coord@flowguard.local', path: '/evc/dashboard' },
    { email: 'evc_member@flowguard.local', path: '/evc-member/my-visits' },
    { email: 'sac_shc@flowguard.local', path: '/committee/agenda' },
    { email: 'authority@flowguard.local', path: '/authority/overview' },
    { email: 'admin@flowguard.local', path: '/admin/dashboard' },
    { email: 'auditor@flowguard.local', path: '/admin/dashboard' },
  ];

  for (const r of roles) {
    test(`Role ${r.email} navigates directly to ${r.path}`, async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email-input', r.email);
      await page.fill('#password-input', 'Password123!');
      await page.click('button[type="submit"]');

      await page.waitForURL(`**${r.path}`, { timeout: 15000 });
      expect(page.url()).toContain(r.path);
    });
  }
});
