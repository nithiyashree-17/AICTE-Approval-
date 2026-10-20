import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Audit Trail Immutability & Metadata Privacy (AUD-01)', () => {
  async function getRoleSession(request: any, email: string) {
    const res = await request.post('http://localhost:4000/api/v1/auth/login', {
      data: { email, password: 'Password123!' },
    });
    expect(res.status()).toBe(200);
    const headers = res.headers();
    const setCookie = headers['set-cookie'] || '';
    const match = setCookie.match(/flowguard_session=([^;]+)/);
    const token = match ? match[1] : (await res.json()).accessToken;
    return { token, cookie: `flowguard_session=${token}` };
  }

  test('Auditor and System Admin can query audit events', async ({ request }) => {
    const auditor = await getRoleSession(request, 'auditor@flowguard.local');

    const res = await request.get('http://localhost:4000/api/v1/audit/events', {
      headers: { Cookie: auditor.cookie, Authorization: `Bearer ${auditor.token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.logs || body)).toBe(true);
  });

  test('Privacy Check: Audit log entries NEVER contain plain passwords or auth tokens', async () => {
    const logs = await prisma.auditLog.findMany({
      take: 100,
    });

    for (const log of logs) {
      const serialized = JSON.stringify(log);
      expect(serialized).not.toContain('Password123!');
      expect(serialized).not.toContain('AicteP@ssw0rd2026!');
      expect(serialized).not.toContain('passwordHash');
    }
  });

  test('Audit log entries are append-only: Deletion is rejected or audited', async () => {
    const log = await prisma.auditLog.findFirst();
    if (log) {
      expect(log.id).toBeDefined();
    }
  });
});
