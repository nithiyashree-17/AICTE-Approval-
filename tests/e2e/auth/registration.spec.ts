import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Institution Self-Registration & Verification', () => {
  test.describe.configure({ mode: 'serial' });

  const uniqueTimestamp = Date.now();
  const testEmail = `new-inst-${uniqueTimestamp}@flowguard.local`;

  test('Institution registers successfully with strict INSTITUTION role binding', async ({ page }) => {
    await page.goto('/register');

    // Fill form using exact DOM selectors
    await page.fill('#institution-name', `Institute of Test ${uniqueTimestamp}`);
    await page.selectOption('#institution-type', 'ENGINEERING');
    await page.selectOption('#region-select', 'NORTH');
    await page.fill('#state-input', 'Delhi');
    await page.fill('#phone-input', '+91 98765 43210');
    await page.fill('#address-input', 'Institutional Area 45, Tech Sector, New Delhi 110001');
    await page.fill('#contact-name', 'Prof. Registrar Test');
    await page.fill('#contact-designation', 'Registrar & Secretary');
    await page.fill('#official-email', testEmail);
    await page.fill('#password', 'AicteP@ssw0rd2026!');
    await page.fill('#confirm-password', 'AicteP@ssw0rd2026!');
    await page.locator('input[type="checkbox"]').check();

    await page.click('button[type="submit"]');

    // Should redirect to success page
    await page.waitForURL(/.*register\/success.*/, { timeout: 15000 });
    expect(page.url()).toContain('register/success');

    // Assert user created in PostgreSQL with INSTITUTION role strictly
    const userInDb = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { roles: { include: { role: true } } },
    });

    expect(userInDb).toBeDefined();
    expect(userInDb?.roles.length).toBe(1);
    expect(userInDb?.roles[0].role.name).toBe('INSTITUTION');
  });

  test('Registration ignores or rejects role/scope privilege escalation attempts in request body', async ({ request }) => {
    const maliciousEmail = `hacker-${uniqueTimestamp}@flowguard.local`;
    const res = await request.post('http://localhost:4000/api/v1/auth/register-institution', {
      data: {
        institutionName: 'Malicious College',
        institutionType: 'ENGINEERING',
        region: 'NORTH',
        state: 'Delhi',
        address: '123 Fake Street',
        officialEmail: maliciousEmail,
        phone: '+91 99999 88888',
        contactPersonName: 'Mr. Attacker',
        contactPersonDesignation: 'Hacker',
        password: 'AicteP@ssw0rd2026!',
        confirmPassword: 'AicteP@ssw0rd2026!',
        consent: true,
        // Injected unauthorized privilege elevation fields
        role: 'SYSTEM_ADMINISTRATOR',
        roles: ['SYSTEM_ADMINISTRATOR', 'COMPETENT_AUTHORITY'],
        isAdmin: true,
      },
    });

    // NestJS ValidationPipe with forbidNonWhitelisted returns 400 Bad Request
    expect([400, 201]).toContain(res.status());

    if (res.status() === 201) {
      // If accepted, verify user was NOT granted admin role in DB
      const user = await prisma.user.findUnique({
        where: { email: maliciousEmail },
        include: { roles: { include: { role: true } } },
      });
      const roleNames = user?.roles.map((r: any) => r.role.name) || [];
      expect(roleNames).not.toContain('SYSTEM_ADMINISTRATOR');
      expect(roleNames).not.toContain('COMPETENT_AUTHORITY');
      expect(roleNames).toContain('INSTITUTION');
    }
  });

  test('Registered institution can login directly through real form', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email-input', testEmail);
    await page.fill('#password-input', 'AicteP@ssw0rd2026!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/institution/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/institution/dashboard');
  });
});
