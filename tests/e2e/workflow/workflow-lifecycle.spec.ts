import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Regulatory Workflow Lifecycle (WF-01 to WF-04, AUD-01)', () => {
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

  let createdAppId: string;
  let applicationNumber: string;

  test('WF-01 & AUD-01: Institution creates and submits application atomically', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');

    // 1. Create Draft
    const draftRes = await request.post('http://localhost:4000/api/v1/applications', {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        type: 'NEW_INSTITUTION_LOA',
        academicYear: '2026-2027',
        assignedRegion: 'NORTH',
      },
    });
    expect(draftRes.status()).toBe(201);
    const draftBody = await draftRes.json();
    createdAppId = draftBody.id;
    applicationNumber = draftBody.applicationNumber;

    expect(createdAppId).toBeDefined();
    expect(applicationNumber).toMatch(/^AICTE-2026-N-\d+/);
    expect(draftBody.currentState).toBe('DRAFT');

    // 2. Transition from DRAFT -> SUBMITTED
    const submitRes = await request.post(`http://localhost:4000/api/v1/applications/${createdAppId}/transitions`, {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        targetStage: 'SUBMITTED',
        reason: 'Statutory submission of Letter of Approval application dossier',
      },
    });
    expect(submitRes.status()).toBe(200);
    const submitBody = await submitRes.json();
    const current = submitBody.currentState || submitBody.application?.currentState;
    expect(current).toBe('SUBMITTED');

    // AUD-01: Verify DB consistency across Application, Stage History, Audit Log, and Outbox Event
    const appInDb = await prisma.application.findUnique({
      where: { id: createdAppId },
      include: { stageHistory: true },
    });
    expect(appInDb?.currentState).toBe('SUBMITTED');
    expect(appInDb?.stageHistory.length).toBeGreaterThanOrEqual(1);

    const historyRecord = appInDb?.stageHistory.find((h: any) => h.toState === 'SUBMITTED');
    expect(historyRecord).toBeDefined();
    expect(historyRecord?.fromState).toBe('DRAFT');

    // Verify outbox event emitted
    const outboxEvents = await prisma.outboxEvent.findMany({
      where: {
        eventType: 'STAGE_CHANGED',
        payload: { path: ['applicationId'], equals: createdAppId },
      },
    });
    expect(outboxEvents.length).toBeGreaterThanOrEqual(1);

    // Verify audit log
    const auditLogs = await prisma.auditLog.findMany({
      where: { resourceId: createdAppId },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  test('WF-02: Scrutiny Officer raises itemized deficiency and notifies institution', async ({ request }) => {
    const ro = await getRoleSession(request, 'ro@flowguard.local');
    const so = await getRoleSession(request, 'scrutiny@flowguard.local');

    // Regional officer assigns scrutiny (SUBMITTED -> SCRUTINY)
    const assignRes = await request.post(`http://localhost:4000/api/v1/applications/${createdAppId}/transitions`, {
      headers: { Cookie: ro.cookie, Authorization: `Bearer ${ro.token}` },
      data: {
        targetStage: 'SCRUTINY',
        reason: 'Assignment to Northern Region Scrutiny Board',
      },
    });
    expect(assignRes.status()).toBe(200);

    // Scrutiny Officer raises deficiency
    const defRes = await request.post(`http://localhost:4000/api/v1/applications/${createdAppId}/deficiencies`, {
      headers: { Cookie: so.cookie, Authorization: `Bearer ${so.token}` },
      data: {
        clauseReference: 'Chapter I Clause 4.2',
        observation: 'Land registration deed missing sub-registrar certified copy',
        requiredCorrection: 'Upload attested registered title deed with surveyor boundary certificate',
      },
    });
    expect(defRes.status()).toBe(201);
    const defBody = await defRes.json();
    expect(defBody.id).toBeDefined();
    expect(defBody.clauseReference).toContain('Clause 4.2');

    // Transition to DEFICIENCY_RESPONSE
    const issueDefRes = await request.post(`http://localhost:4000/api/v1/applications/${createdAppId}/transitions`, {
      headers: { Cookie: so.cookie, Authorization: `Bearer ${so.token}` },
      data: {
        targetStage: 'DEFICIENCY_RESPONSE',
        reason: 'Deficiencies itemized and issued to institution',
      },
    });
    expect(issueDefRes.status()).toBe(200);

    const app = await prisma.application.findUnique({ where: { id: createdAppId } });
    expect(app?.currentState).toBe('DEFICIENCY_RESPONSE');
  });

  test('WF-03: Institution uploads rectification and resubmits to RE_SCRUTINY', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');

    // Find open deficiency
    const deficiencies = await prisma.deficiency.findMany({
      where: { applicationId: createdAppId },
    });
    expect(deficiencies.length).toBeGreaterThanOrEqual(1);
    const defId = deficiencies[0].id;

    // Institution responds to deficiency
    const respondRes = await request.post(`http://localhost:4000/api/v1/deficiencies/${defId}/respond`, {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        institutionResponse: 'Certified copy of land deed attached and verified by sub-registrar',
      },
    });
    expect([200, 201]).toContain(respondRes.status());

    // Transition from DEFICIENCY_RESPONSE -> RE_SCRUTINY
    const resubmitRes = await request.post(`http://localhost:4000/api/v1/applications/${createdAppId}/transitions`, {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        targetStage: 'RE_SCRUTINY',
        reason: 'Remediation completed; resubmitted for secondary scrutiny',
      },
    });
    expect(resubmitRes.status()).toBe(200);

    const updatedApp = await prisma.application.findUnique({ where: { id: createdAppId } });
    expect(updatedApp?.currentState).toBe('RE_SCRUTINY');
  });

  test('WF-04: Invalid state transitions are strictly rejected with 400 Bad Request', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');
    const so = await getRoleSession(request, 'scrutiny@flowguard.local');

    // Attempting invalid jump from RE_SCRUTINY directly to CLOSED_APPROVED (skipping EVC, Hearing, Decision Pending)
    const invalidJumpRes = await request.post(`http://localhost:4000/api/v1/applications/${createdAppId}/transitions`, {
      headers: { Cookie: so.cookie, Authorization: `Bearer ${so.token}` },
      data: {
        targetStage: 'CLOSED_APPROVED',
        reason: 'Illegal jump straight to approved',
      },
    });

    expect(invalidJumpRes.status()).toBe(400);
    const errBody = await invalidJumpRes.json();
    expect(errBody.message.toLowerCase()).toContain('invalid stage transition');

    // Assert database state was unchanged
    const unchangedApp = await prisma.application.findUnique({ where: { id: createdAppId } });
    expect(unchangedApp?.currentState).toBe('RE_SCRUTINY');
  });

  test('Multi-Template verification: Template A (New Institution) vs Template B (Routine EoA)', async ({ request }) => {
    const so = await getRoleSession(request, 'scrutiny@flowguard.local');

    // Template definitions
    const res = await request.get('http://localhost:4000/api/v1/workflow/templates', {
      headers: { Cookie: so.cookie, Authorization: `Bearer ${so.token}` },
    });
    expect(res.status()).toBe(200);
    const templates = await res.json();

    const templateA = templates.find((t: any) => t.key.includes('NEW_INSTITUTION') || t.key.includes('TEMPLATE_A'));
    const templateB = templates.find((t: any) => t.key.includes('ROUTINE') || t.key.includes('TEMPLATE_B'));

    expect(templateA).toBeDefined();
    expect(templateB).toBeDefined();

    // Template A must include EVC / physical inspection; Routine EoA does not require EVC
    expect(templateA.allowedStages).toContain('EVC_SCHEDULED');
    expect(templateB.allowedStages).not.toContain('EVC_SCHEDULED');
  });
});
