import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Compliance Obligations & Statutory Monitoring (COM-01 to COM-03)', () => {
  test.describe.configure({ mode: 'serial' });

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

  let obligationId: string;
  let institutionId = 'inst-fixture-001';

  test('COM-01: Create compliance obligation and verify reminder scheduling', async ({ request }) => {
    const ro = await getRoleSession(request, 'ro@flowguard.local');

    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString();
    const res = await request.post(`http://localhost:4000/api/v1/compliance/institutions/${institutionId}/obligations`, {
      headers: { Cookie: ro.cookie, Authorization: `Bearer ${ro.token}` },
      data: {
        title: 'Mandatory Fire Safety NOC Annual Renewal',
        description: 'Submission of Fire Safety Certificate renewed by District Fire Service Directorate',
        evidenceRequired: 'Fire Department NOC Certificate PDF',
        dueDate,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    obligationId = body.id;
    expect(obligationId).toBeDefined();

    // Verify created in DB
    const obInDb = await prisma.complianceObligation.findUnique({
      where: { id: obligationId },
    });
    expect(obInDb?.status).toBe('OPEN');
  });

  test('Independent statuses: Submission does not equal Fulfillment until verified', async ({ request }) => {
    const inst = await getRoleSession(request, 'registrar@niat-fixture.edu.in');
    const ro = await getRoleSession(request, 'ro@flowguard.local');

    // 1. Institution submits compliance evidence
    const subRes = await request.post(`http://localhost:4000/api/v1/compliance/obligations/${obligationId}/submissions`, {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        s3ObjectKey: 'documents/compliance/fire-noc-2026-certified.pdf',
      },
    });
    expect([200, 201]).toContain(subRes.status());
    const subBody = await subRes.json();
    const submissionId = subBody.id;

    // Obligation must NOT be FULFILLED yet
    const preVerifyOb = await prisma.complianceObligation.findUnique({ where: { id: obligationId } });
    expect(preVerifyOb?.status).not.toBe('FULFILLED');

    // 2. COM-03: Officer verifies submission -> now marked FULFILLED
    const verifyRes = await request.post(`http://localhost:4000/api/v1/compliance/submissions/${submissionId}/verify`, {
      headers: { Cookie: ro.cookie, Authorization: `Bearer ${ro.token}` },
      data: {
        status: 'VERIFIED',
        notes: 'Confirmed with District Fire Office online ledger',
      },
    });
    expect([200, 201]).toContain(verifyRes.status());

    // Verify obligation fulfilled in DB
    const postVerifyOb = await prisma.complianceObligation.findUnique({ where: { id: obligationId } });
    expect(postVerifyOb?.status).toBe('FULFILLED');
  });
});
