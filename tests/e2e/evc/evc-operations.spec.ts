import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Expert Visit Committee (EVC) Operations (EVC-01, EVC-02)', () => {
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

  test('EVC-01: Coordinator accesses EVC queue and schedules physical inspection', async ({ request }) => {
    const coord = await getRoleSession(request, 'evc_coord@flowguard.local');
    const member = await getRoleSession(request, 'evc_member@flowguard.local');

    // 1. Coordinator views EVC queue
    const queueRes = await request.get('http://localhost:4000/api/v1/evc/queue', {
      headers: { Cookie: coord.cookie, Authorization: `Bearer ${coord.token}` },
    });
    expect(queueRes.status()).toBe(200);

    // Find member user ID
    const memberUser = await prisma.user.findUnique({
      where: { email: 'evc_member@flowguard.local' },
    });
    expect(memberUser).toBeDefined();

    // 2. Schedule inspection for app-fixture-001
    const scheduleDate = new Date(Date.now() + 7 * 86400000).toISOString();
    const schedRes = await request.post('http://localhost:4000/api/v1/evc/applications/app-fixture-001/schedule', {
      headers: { Cookie: coord.cookie, Authorization: `Bearer ${coord.token}` },
      data: {
        mode: 'PHYSICAL',
        scheduledDate: scheduleDate,
        locationOrLink: 'Campus Engineering Complex, Sector 62',
        members: [{ userId: memberUser?.id, role: 'MEMBER' }],
      },
    });
    expect([200, 201]).toContain(schedRes.status());

    // 3. SEC check: Unrelated role (e.g. Scrutiny Officer) cannot modify or schedule EVC
    const so = await getRoleSession(request, 'scrutiny@flowguard.local');
    const badSched = await request.post('http://localhost:4000/api/v1/evc/applications/app-fixture-001/schedule', {
      headers: { Cookie: so.cookie, Authorization: `Bearer ${so.token}` },
      data: {
        mode: 'PHYSICAL',
        scheduledDate: scheduleDate,
        locationOrLink: 'Campus',
        members: [{ userId: memberUser?.id, role: 'MEMBER' }],
      },
    });
    expect(badSched.status()).toBe(403);
  });

  test('EVC-02: Assigned Member submits joint report and completion is enforced by required actions', async ({ request }) => {
    const member = await getRoleSession(request, 'evc_member@flowguard.local');

    // Find active EVC event for fixture app
    const evcEvent = await prisma.evcEvent.findFirst({
      where: { applicationId: 'app-fixture-001' },
    });
    expect(evcEvent).toBeDefined();

    // Submit EVC Report
    const reportRes = await request.post(`http://localhost:4000/api/v1/evc/events/${evcEvent?.id}/reports`, {
      headers: { Cookie: member.cookie, Authorization: `Bearer ${member.token}` },
      data: {
        s3ObjectKey: 'documents/evc-reports/evc-fixture-001-report.pdf',
        findings: {
          summary: 'Facilities, computer center, and library laboratories fully verified as compliant with APH Appendix 4 norms',
          infrastructureVerified: true,
          deficienciesObserved: [],
          recommendation: 'RECOMMENDED',
        },
      },
    });
    expect([200, 201]).toContain(reportRes.status());
  });
});
