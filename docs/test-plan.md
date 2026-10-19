# AICTE FlowGuard — Comprehensive Test Plan & Acceptance Matrix

**Document Control:**
- **Project:** AICTE FlowGuard (Problem Statement ID: 26262)
- **Document Role:** Teammate D (Automation / QA / Integration)
- **Status:** Complete Test Suite & Acceptance Matrix
- **Testing Frameworks:** Vitest (Unit/Integration), Supertest (API Integration), Playwright (E2E)
- **Source Basis:** Section 19 of AICTE FlowGuard Implementation Plan

---

## 1. Test Strategy & Acceptance Matrix

| Test ID | Test Scenario | Execution Level | Expected Outcome & Assertion Criteria |
| :--- | :--- | :--- | :--- |
| **WF-01** | Institution submits complete application | Integration / API | Case transitions `DRAFT -> SUBMITTED`; application number generated; stage history & audit log written; outbox event emitted. |
| **WF-02** | Scrutiny Officer raises deficiency | Integration / API | Case transitions `SCRUTINY -> DEFICIENCY_RESPONSE`; itemized deficiency rows inserted; BullMQ reminder scheduled; alert dispatched to institution. |
| **WF-03** | Institution resubmits rectified evidence | Integration / API | Previous document version retained; new version inserted; case transitions `DEFICIENCY_RESPONSE -> RE_SCRUTINY`; Scrutiny Officer queue updated. |
| **WF-04** | Invalid workflow transition attempted | Unit / API Guard | Request rejected with HTTP 400 Bad Request; explanatory error message returned; database state remains unaltered. |
| **EVC-01** | EVC-required case enters queue | Integration / Scope | Coordinator sees case in regional queue; unrelated roles cannot schedule or modify committee roster (HTTP 403 Forbidden). |
| **EVC-02** | EVC report submitted by member | Integration / API | Assigned committee member uploads joint report and media links; completion is recorded only after required evidence attached; state -> `EVC_REVIEW`. |
| **COM-01** | Compliance obligation due soon | Worker / Queue | BullMQ fires reminder job; exactly one in-app alert and email dispatched per configured offset (T-7d, T-3d). |
| **COM-02** | Compliance deadline missed | Worker / Escalation | Obligation marked `OVERDUE`; automated Level 1 escalation logged and notified to Section Supervisor. |
| **COM-03** | Obligation fulfilled prior to due date | Integration / Queue | Document verified; obligation marked `FULFILLED`; pending scheduled reminder jobs in Redis suppressed/cancelled. |
| **DOC-01** | Renewed registered lease uploaded | Integration / Storage | Historical lease document preserved as version 1; new upload stored as version 2; case queued for officer verification. |
| **SEC-01** | Institution accesses peer institution case | Security / Scope | API returns HTTP 403 Forbidden server-side; attempt logged in security audit events. |
| **SEC-02** | EVC member attempts to edit unassigned case | Security / Scope | API returns HTTP 403 Forbidden server-side. |
| **SEC-03** | Auditor attempts write/mutation operation | Security / RBAC | Auditor token executing `POST / PUT / DELETE` returns HTTP 403 Forbidden. |
| **SEC-04** | System Administrator attempts statutory decision | Security / RBAC | Admin attempting `GRANT_APPROVAL` or `ISSUE_REJECTION` returns HTTP 403 Forbidden. |
| **JOB-01** | Queue outage and recovery | Worker / Resilience | Outbox poller and reconciliation worker resume processing uncommitted events after queue recovery with zero data loss. |
| **JOB-02** | Duplicate job delivery | Worker / Idempotency | Redis idempotency key deduplicates identical deliveries, preventing repeated email or alert dispatches. |
| **AUD-01** | Transition atomicity check | Database ACID | Application state update, stage history, audit log, and outbox event commit in single atomic transaction; zero partial state updates. |
| **DASH-01** | Dashboard KPI drill-down | Integration / Query | Aggregated count on dashboard card matches exact query result count of filtered application list. |
| **TIME-01** | Deadline modified / Date boundary crossed | Worker / Time | Deadline update invalidates existing delayed jobs; new schedule applied with correct UTC/IST conversions. |

---

## 2. Executable Integration Test Suites (Vitest + Supertest)

### 2.1 Workflow Transition & Audit Atomicity Test (`WF-01`, `WF-04`, `AUD-01`)

```typescript
// tests/integration/workflow-transition.spec.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../helpers/test-app';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';

describe('Workflow Transition Service (WF-01, WF-04, AUD-01)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let institutionToken: string;
  let scrutinyToken: string;
  let testAppId: string;

  beforeEach(async () => {
    app = await createTestingApp();
    prisma = app.get(PrismaService);

    // Seed test users & authenticate tokens
    institutionToken = await getAuthToken(app, 'inst-user@test.edu', 'ROLE_INSTITUTION');
    scrutinyToken = await getAuthToken(app, 'scrutiny@aicte.gov.in', 'ROLE_SCRUTINY_OFFICER');

    // Create draft application
    const appRecord = await prisma.application.create({
      data: {
        applicationNumber: 'AICTE-TEST-2026-001',
        academicYear: '2026-2027',
        category: 'NEW_INSTITUTION_LOA',
        currentStage: 'DRAFT',
        institutionId: 'inst-test-uuid',
        regionId: 'reg-nw-uuid',
        workflowVersionId: 'wf-v1-uuid',
      },
    });
    testAppId = appRecord.id;
  });

  it('WF-01 & AUD-01: should transition from DRAFT to SUBMITTED atomically', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/applications/${testAppId}/submit`)
      .set('Authorization', `Bearer ${institutionToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.currentStage).toBe('SUBMITTED');

    // Verify database consistency
    const updated = await prisma.application.findUnique({ where: { id: testAppId } });
    expect(updated?.currentStage).toBe('SUBMITTED');

    // Verify stage history was written
    const history = await prisma.applicationStageHistory.findMany({
      where: { applicationId: testAppId },
    });
    expect(history.length).toBe(1);
    expect(history[0].fromStage).toBe('DRAFT');
    expect(history[0].toStage).toBe('SUBMITTED');

    // Verify outbox event was generated
    const outbox = await prisma.outboxEvent.findFirst({
      where: { aggregateId: testAppId, eventType: 'APPLICATION_SUBMIT_APPLICATION' },
    });
    expect(outbox).toBeDefined();
    expect(outbox?.status).toBe('PENDING');
  });

  it('WF-04: should reject invalid transition with HTTP 400 Bad Request', async () => {
    // Attempt invalid jump: DRAFT directly to DECISION_PENDING
    const res = await request(app.getHttpServer())
      .post(`/api/v1/applications/${testAppId}/transitions`)
      .set('Authorization', `Bearer ${institutionToken}`)
      .send({
        targetStage: 'DECISION_PENDING',
        reason: 'Attempting unauthorized bypass',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid transition');

    // Verify state unchanged
    const current = await prisma.application.findUnique({ where: { id: testAppId } });
    expect(current?.currentStage).toBe('DRAFT');
  });
});
```

### 2.2 Multi-Tenant Scope & Security Tests (`SEC-01`, `SEC-04`)

```typescript
// tests/security/scope-security.spec.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestingApp } from '../helpers/test-app';

describe('Security & Multi-Tenant Scoping (SEC-01, SEC-04)', () => {
  it('SEC-01: Institution A cannot access Institution B application', async () => {
    const app = await createTestingApp();
    const instAToken = await getAuthToken(app, 'inst-a@college.edu', 'ROLE_INSTITUTION');
    const instBAppId = 'app-belonging-to-inst-b';

    const res = await request(app.getHttpServer())
      .get(`/api/v1/applications/${instBAppId}`)
      .set('Authorization', `Bearer ${instAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Cross-institution access');
  });

  it('SEC-04: System Administrator cannot execute statutory approval', async () => {
    const app = await createTestingApp();
    const adminToken = await getAuthToken(app, 'admin@aicte.gov.in', 'ROLE_SYSTEM_ADMIN');
    const caseId = 'app-in-decision-pending';

    const res = await request(app.getHttpServer())
      .post(`/api/v1/applications/${caseId}/transitions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetStage: 'CLOSED_APPROVED',
        reason: 'Admin attempting direct approval',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('not authorized');
  });
});
```

---

## 3. End-to-End Browser Testing (Playwright)

The Playwright test suite (`tests/e2e/vertical-slice.spec.ts`) automates the full primary user journey:
1. **Login:** Demo switcher logs in as Institution (`inst-demo`).
2. **Draft & Submit:** Fills application details, validates checklist, submits, and views generated submission receipt.
3. **Scrutiny Officer Review:** Switch to Scrutiny Officer (`officer-demo`), review documents, record deficiency.
4. **Resubmission:** Switch to Institution, view deficiency notification, upload rectified document.
5. **Re-Scrutiny & EVC Queue:** Switch to Scrutiny Officer, mark resolved, forward to EVC queue.
6. **Auditor Verification:** Switch to Auditor, confirm immutable audit logs and timeline events are present.
