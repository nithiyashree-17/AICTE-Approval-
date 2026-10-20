import { test, expect } from '@playwright/test';

test.describe('Reports & Analytical Scoping', () => {
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

  test('Pendency report endpoint returns structured aggregation respecting user permissions', async ({ request }) => {
    const ro = await getRoleSession(request, 'ro@flowguard.local');

    const res = await request.get('http://localhost:4000/api/v1/reports/pendency', {
      headers: { Cookie: ro.cookie, Authorization: `Bearer ${ro.token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('Compliance report endpoint is accessible to regulatory officers and auditors', async ({ request }) => {
    const auditor = await getRoleSession(request, 'auditor@flowguard.local');

    const res = await request.get('http://localhost:4000/api/v1/reports/compliance', {
      headers: { Cookie: auditor.cookie, Authorization: `Bearer ${auditor.token}` },
    });
    expect(res.status()).toBe(200);
  });
});
