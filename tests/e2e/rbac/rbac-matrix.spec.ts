import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('RBAC & Multi-Tenant Boundary Enforcement', () => {
  // Helper to obtain a JWT cookie/token for any role
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

  test('SEC-01: Institution A cannot read or modify Institution B application', async ({ request }) => {
    // Institution A
    const instA = await getRoleSession(request, 'institution@flowguard.local');
    // Application belonging to inst-fixture-002 (Institution B)
    const targetAppId = 'app-fixture-002';

    // 1. Reading B's application must return 403 Forbidden or 404 Not Found
    const readRes = await request.get(`http://localhost:4000/api/v1/applications/${targetAppId}`, {
      headers: { Cookie: instA.cookie, Authorization: `Bearer ${instA.token}` },
    });
    expect([403, 404]).toContain(readRes.status());

    // 2. Modifying B's draft must return 403 Forbidden or 404
    const mutateRes = await request.patch(`http://localhost:4000/api/v1/applications/${targetAppId}/draft`, {
      headers: { Cookie: instA.cookie, Authorization: `Bearer ${instA.token}` },
      data: { academicYear: '2027-2028' },
    });
    expect([403, 404]).toContain(mutateRes.status());
  });

  test('SEC-02: Regional Officer cannot view or modify a case outside their assigned region', async ({ request }) => {
    // North RO
    const roNorth = await getRoleSession(request, 'ro@flowguard.local');
    // Application in SOUTH region (app-fixture-002)
    const southAppId = 'app-fixture-002';

    const res = await request.get(`http://localhost:4000/api/v1/applications/${southAppId}`, {
      headers: { Cookie: roNorth.cookie, Authorization: `Bearer ${roNorth.token}` },
    });
    expect([403, 404]).toContain(res.status());
  });

  test('SEC-03: Independent Auditor role gets 403 Forbidden on write / mutation endpoints', async ({ request }) => {
    const auditor = await getRoleSession(request, 'auditor@flowguard.local');

    // 1. Mutation on Applications
    const appMutation = await request.post('http://localhost:4000/api/v1/applications', {
      headers: { Cookie: auditor.cookie, Authorization: `Bearer ${auditor.token}` },
      data: { type: 'NEW_INSTITUTION_LOA', academicYear: '2026-2027', assignedRegion: 'NORTH' },
    });
    expect(appMutation.status()).toBe(403);

    // 2. Mutation on Scrutiny Deficiencies
    const defMutation = await request.post('http://localhost:4000/api/v1/applications/app-fixture-001/deficiencies', {
      headers: { Cookie: auditor.cookie, Authorization: `Bearer ${auditor.token}` },
      data: { clauseReference: 'Chapter I', observation: 'Test Observation', requiredCorrection: 'Fix it' },
    });
    expect(defMutation.status()).toBe(403);

    // 3. Mutation on EVC schedule
    const evcMutation = await request.post('http://localhost:4000/api/v1/evc/applications/app-fixture-001/schedule', {
      headers: { Cookie: auditor.cookie, Authorization: `Bearer ${auditor.token}` },
      data: { mode: 'PHYSICAL', scheduledDate: new Date().toISOString(), locationOrLink: 'Campus', memberUserIds: [] },
    });
    expect(evcMutation.status()).toBe(403);
  });

  test('SEC-04: System Administrator is prohibited from executing statutory workflow decisions', async ({ request }) => {
    const admin = await getRoleSession(request, 'admin@flowguard.local');
    const targetAppId = 'app-fixture-001';

    // System admin attempting GRANT_APPROVAL or state transition
    const transitionRes = await request.post(`http://localhost:4000/api/v1/applications/${targetAppId}/transitions`, {
      headers: { Cookie: admin.cookie, Authorization: `Bearer ${admin.token}` },
      data: {
        targetStage: 'APPROVED',
        reason: 'Unauthorized admin approval override',
      },
    });

    // Must be rejected with 403 Forbidden
    expect([400, 403]).toContain(transitionRes.status());
  });

  test('Non-admin users cannot grant or modify roles', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');
    const ro = await getRoleSession(request, 'ro@flowguard.local');

    for (const session of [inst, ro]) {
      const grantRes = await request.post('http://localhost:4000/api/v1/users/grant-role', {
        headers: { Cookie: session.cookie, Authorization: `Bearer ${session.token}` },
        data: { userId: 'any-user-id', role: 'SYSTEM_ADMINISTRATOR' },
      });
      expect([401, 403, 404]).toContain(grantRes.status());
    }
  });

  test('Unauthenticated calls to all protected API routes return 401 Unauthorized', async ({ request }) => {
    const protectedEndpoints = [
      { method: 'GET', path: '/auth/me' },
      { method: 'GET', path: '/applications' },
      { method: 'GET', path: '/workflow/stages' },
      { method: 'GET', path: '/compliance/obligations' },
      { method: 'GET', path: '/notifications' },
      { method: 'GET', path: '/audit/events' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await request.fetch(`http://localhost:4000/api/v1${ep.path}`, {
        method: ep.method,
      });
      expect(res.status()).toBe(401);
    }
  });
});
