import { test, expect } from '@playwright/test';

const ROLES_TEST_DATA = [
  {
    roleName: 'INSTITUTION',
    email: 'institution@flowguard.local',
    expectedLanding: '/institution/dashboard',
  },
  {
    roleName: 'REGIONAL_OFFICER',
    email: 'ro@flowguard.local',
    expectedLanding: '/regional/dashboard',
  },
  {
    roleName: 'BUREAU_OFFICER',
    email: 'bureau@flowguard.local',
    expectedLanding: '/bureau/dashboard',
  },
  {
    roleName: 'SCRUTINY_OFFICER',
    email: 'scrutiny@flowguard.local',
    expectedLanding: '/scrutiny/dashboard',
  },
  {
    roleName: 'EVC_COORDINATOR',
    email: 'evc_coord@flowguard.local',
    expectedLanding: '/evc/dashboard',
  },
  {
    roleName: 'EVC_MEMBER',
    email: 'evc_member@flowguard.local',
    expectedLanding: '/evc-member/my-visits',
  },
  {
    roleName: 'SAC_SHC',
    email: 'sac_shc@flowguard.local',
    expectedLanding: '/committee/agenda',
  },
  {
    roleName: 'COMPETENT_AUTHORITY',
    email: 'authority@flowguard.local',
    expectedLanding: '/authority/overview',
  },
  {
    roleName: 'SYSTEM_ADMINISTRATOR',
    email: 'admin@flowguard.local',
    expectedLanding: '/admin/dashboard',
  },
];

for (const user of ROLES_TEST_DATA) {
  test(`Role [${user.roleName}]: Real Form Login lands on ${user.expectedLanding}`, async ({ page, context }) => {
    // 1. Clear cookies to ensure isolated fresh session
    await context.clearCookies();

    // 2. Navigate to real login page
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // 3. Fill real form inputs
    await page.fill('#email-input', user.email);
    await page.fill('#password-input', 'Password123!');

    // 4. Submit form
    await page.click('button[type=\"submit\"]');

    // 5. Assert browser navigates to that role's canonical landing route and stays there
    await page.waitForURL(`**${user.expectedLanding}`, { timeout: 15000 });
    expect(page.url()).toContain(user.expectedLanding);

    // 6. Assert flowguard_session cookie is set in browser
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'flowguard_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value.length).toBeGreaterThan(20);
  });
}
