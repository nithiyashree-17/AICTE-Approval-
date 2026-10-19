/**
 * Automated Verification of Workflow Engine, Scope Guards, and Deadline Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_DEFINITIONS,
  getStageDefinition,
} from '../stage-definitions/index.ts';
import {
  WORKFLOW_TEMPLATES,
  getWorkflowByCategory,
} from '../application-types/index.ts';
import { DeadlineCalculator } from '../deadline-calculator.ts';
import { NotificationEngine } from '../notification-engine.ts';
import { WorkflowEngine } from '../workflow-engine.ts';

test('5. DeadlineCalculator - Statutory vs Prototype Calculations', async (t) => {
  await t.test('SAC Appeal 7-calendar-day strict statutory deadline calculation', () => {
    const uploadTimestamp = '2026-10-19T10:00:00.000Z';
    const deadline = DeadlineCalculator.calculateSacAppealDeadline(uploadTimestamp);

    assert.equal(deadline.isStrictStatutoryCutoff, true);
    // 7 days later: 2026-10-26T23:59:59.999Z
    assert.equal(deadline.dueTimestamp, '2026-10-26T23:59:59.999Z');
    assert.equal(deadline.dueDateFormatted, '2026-10-26');

    // Test within limit: Day 5 is allowed
    const day5Submission = '2026-10-24T12:00:00.000Z';
    assert.equal(
      DeadlineCalculator.isSacAppealWithinStatutoryLimit(uploadTimestamp, day5Submission),
      true
    );

    // Test time-barred: Day 8 is barred
    const day8Submission = '2026-10-27T00:00:01.000Z';
    assert.equal(
      DeadlineCalculator.isSacAppealWithinStatutoryLimit(uploadTimestamp, day8Submission),
      false
    );
  });

  await t.test('Deterministic Idempotency Key Generation', () => {
    const key = DeadlineCalculator.generateIdempotencyKey(
      'app-1234',
      'DEFICIENCY_ISSUED_INSTITUTION_ALERT',
      -3,
      'user-5678',
      1
    );
    assert.equal(key, 'app-1234:DEFICIENCY_ISSUED_INSTITUTION_ALERT:-3:user-5678:v1');
  });
});

test('6. NotificationEngine Template Interpolation and Recheck', async (t) => {
  await t.test('Template variables are interpolated accurately', () => {
    const compiled = NotificationEngine.compileNotification(
      'DEFICIENCY_ISSUED_INSTITUTION_ALERT',
      {
        applicationNumber: 'AICTE-2026-LOA-00142',
        institutionName: 'Apex Institute of Technology',
        deficiencyCount: 2,
        deficiencyDueDate: '2026-10-26',
        deficienciesSummary: '1. Land Deed missing seal. 2. Fire NOC expired.',
      },
      ['inst-user-1'],
      'IMMEDIATE',
      'app-1234'
    );

    assert.ok(compiled.subject.includes('AICTE-2026-LOA-00142'));
    assert.ok(compiled.inAppBody.includes('Apex Institute of Technology'));
    assert.ok(compiled.inAppBody.includes('2 itemized deficiencies'));
    assert.ok(compiled.emailHtml.includes('Land Deed missing seal'));
  });
});

test('7. WorkflowEngine - Role & Scope Guard Enforcement', async (t) => {
  const sampleContext = {
    id: 'app-uuid-1',
    applicationNumber: 'AICTE-2026-LOA-00142',
    applicationCategory: 'NEW_INSTITUTION',
    currentStage: 'SCRUTINY',
    institutionId: 'inst-north-01',
    regionId: 'reg-north',
    assignedOfficerId: 'officer-so-01',
    createdAt: '2026-10-19T00:00:00.000Z',
    uploadedDocumentTypes: ['SCRUTINY_CLEARANCE_SHEET'],
    activeDeficienciesCount: 0,
    clearedDeficienciesCount: 1,
    evcReportSubmitted: false,
    shcRecommendationRecorded: false,
  };

  await t.test('Assigned Scrutiny Officer can clear scrutiny to EVC_PENDING', () => {
    const soUser = {
      userId: 'officer-so-01',
      role: 'ROLE_SCRUTINY_OFFICER',
      regionId: 'reg-north',
    };

    const res = WorkflowEngine.validateTransition('SCRUTINY', soUser, sampleContext, {
      targetStage: 'EVC_PENDING',
      documentTypesUploaded: ['SCRUTINY_CLEARANCE_SHEET'],
    });

    assert.equal(res.isValid, true);
    assert.equal(res.generatedOutboxEvent, 'SCRUTINY_CLEARED_RECOMMENDED_EVC');
  });

  await t.test('Different unassigned Scrutiny Officer is rejected with SCOPE_VIOLATION', () => {
    const otherSoUser = {
      userId: 'officer-so-99',
      role: 'ROLE_SCRUTINY_OFFICER',
      regionId: 'reg-north',
    };

    const res = WorkflowEngine.validateTransition('SCRUTINY', otherSoUser, sampleContext, {
      targetStage: 'EVC_PENDING',
      documentTypesUploaded: ['SCRUTINY_CLEARANCE_SHEET'],
    });

    assert.equal(res.isValid, false);
    assert.equal(res.errorCode, 'SCOPE_VIOLATION');
    assert.ok(res.reason.includes('Unassigned Case'));
  });

  await t.test('Auditor attempting transition is rejected with ROLE_FORBIDDEN (read-only)', () => {
    const auditorUser = {
      userId: 'auditor-01',
      role: 'ROLE_AUDITOR',
    };

    const res = WorkflowEngine.validateTransition('SCRUTINY', auditorUser, sampleContext, {
      targetStage: 'EVC_PENDING',
    });

    assert.equal(res.isValid, false);
    assert.equal(res.errorCode, 'ROLE_FORBIDDEN');
    assert.ok(res.reason.includes('Auditor Immutability'));
  });

  await t.test('Statutory Safeguard: AI-initiated approval or rejection is prohibited', () => {
    const decContext = {
      ...sampleContext,
      currentStage: 'DECISION_PENDING',
    };

    const compAuthUser = {
      userId: 'chairman-01',
      role: 'ROLE_COMPETENT_AUTHORITY',
    };

    const res = WorkflowEngine.validateTransition('DECISION_PENDING', compAuthUser, decContext, {
      targetStage: 'CLOSED_APPROVED',
      isAiInitiated: true, // Prohibited!
      reason: 'Automated AI decision based on compliant score',
      documentTypesUploaded: ['SIGNED_STATUTORY_APPROVAL_ORDER'],
    });

    assert.equal(res.isValid, false);
    assert.equal(res.errorCode, 'AI_DECISION_PROHIBITED');
    assert.ok(res.reason.includes('Statutory Safeguard Violation'));
  });
});
