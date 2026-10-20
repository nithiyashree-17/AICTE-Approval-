import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authDir = path.join(__dirname, '../../../playwright/.auth');

const ROLES = [
  { role: 'INSTITUTION', email: 'institution@flowguard.local', landing: '/institution/dashboard' },
  { role: 'REGIONAL_OFFICER', email: 'ro@flowguard.local', landing: '/regional/dashboard' },
  { role: 'BUREAU_OFFICER', email: 'bureau@flowguard.local', landing: '/bureau/dashboard' },
  { role: 'SCRUTINY_OFFICER', email: 'scrutiny@flowguard.local', landing: '/scrutiny/dashboard' },
  { role: 'EVC_COORDINATOR', email: 'evc_coord@flowguard.local', landing: '/evc/dashboard' },
  { role: 'EVC_MEMBER', email: 'evc_member@flowguard.local', landing: '/evc-member/my-visits' },
  { role: 'SAC_SHC', email: 'sac_shc@flowguard.local', landing: '/committee/agenda' },
  { role: 'COMPETENT_AUTHORITY', email: 'authority@flowguard.local', landing: '/authority/overview' },
  { role: 'SYSTEM_ADMIN', email: 'admin@flowguard.local', landing: '/admin/dashboard' },
  { role: 'AUDITOR', email: 'auditor@flowguard.local', landing: '/admin/dashboard' },
];

setup('Ensure auth directory exists', async () => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
});

for (const { role, email, landing } of ROLES) {
  setup(`Authenticate via real login flow: ${role}`, async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');

    await page.fill('#email-input', email);
    await page.fill('#password-input', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(`**${landing}`, { timeout: 15000 });
    expect(page.url()).toContain(landing);

    const storagePath = path.join(authDir, `${role.toLowerCase()}.json`);
    await context.storageState({ path: storagePath });
  });
}
