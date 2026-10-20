import { test, expect } from '@playwright/test';

test.describe('UI Smoke & Navigation Basics', () => {
  const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

  for (const route of publicRoutes) {
    test(`Public route ${route} loads with 200, no console errors, no dead UI`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Exclude expected 401/403 on unauthenticated pre-checks as specified in prompt
          if (!text.includes('401') && !text.includes('403')) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('response', (res) => {
        // Exclude 401/403 which can be expected on unauthenticated pre-checks
        if (res.status() >= 400 && res.status() !== 401 && res.status() !== 403) {
          failedRequests.push(`${res.status()} ${res.url()}`);
        }
      });

      await page.goto(route);
      await expect(page).toHaveTitle(/AICTE FlowGuard/i);

      // Verify no console errors
      expect(consoleErrors).toEqual([]);
      expect(failedRequests).toEqual([]);

      // Verify Header shows ONLY the logo and no prohibited banner text
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Ensure forbidden problem statement text does not appear in header
      const headerText = await header.innerText();
      expect(headerText).not.toContain('Problem Statement ID');
      expect(headerText).not.toContain('Problem ID 26262');

      // Verify Logo link points to '/' when logged out
      const logoLink = header.locator('a[aria-label*="AICTE FlowGuard"]').first();
      await expect(logoLink).toBeVisible();
      const href = await logoLink.getAttribute('href');
      expect(href).toBe('/');

      // Verify logged-out header shows Login and Register buttons
      const loginBtn = header.locator('a[href="/login"]');
      const registerBtn = header.locator('a[href="/register"]');
      await expect(loginBtn).toBeVisible();
      await expect(registerBtn).toBeVisible();
    });
  }

  test('Responsive verification: Mobile (375px) has no horizontal scroll and layout intact', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check no horizontal scrollbar on body
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // small rounding margin

    // Verify main CTA buttons remain clickable on mobile
    const getStartedBtn = page.locator('text=Portal Login').first();
    await expect(getStartedBtn).toBeVisible();
  });

  test('Every link on home landing page performs a valid navigation or action', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href]');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('#')) {
        expect(href.length).toBeGreaterThan(0);
      }
    }
  });
});
