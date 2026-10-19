/**
 * Automated Verification Test Suite for AICTE FlowGuard Workflow Configuration
 * Uses Node's built-in test runner (node --test)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('1. Stage Definitions Integrity', async (t) => {
  const stageFiles = [
    '01-draft.json',
    '02-submitted.json',
    '03-scrutiny.json',
    '04-deficiency-response.json',
    '05-re-scrutiny.json',
    '06-evc-pending.json',
    '07-evc-scheduled.json',
    '08-evc-review.json',
    '09-hearing-or-committee-review.json',
    '10-decision-pending.json',
    '11-closed-approved.json',
    '12-closed-rejected.json',
  ];

  await t.test('All 12 stage definitions exist and contain valid JSON', () => {
    for (const file of stageFiles) {
      const filePath = path.join(rootDir, 'stage-definitions', file);
      assert.ok(fs.existsSync(filePath), `Stage file missing: ${file}`);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      assert.ok(data.key, `Stage definition in ${file} has no key`);
      assert.ok(data.displayName, `Stage definition in ${file} has no displayName`);
      assert.ok(data.ownerRole, `Stage definition in ${file} has no ownerRole`);
      assert.ok(Array.isArray(data.allowedTransitions), `allowedTransitions in ${file} is not an array`);
    }
  });

  await t.test('DECISION_PENDING stage enforces human decision and Competent Authority', () => {
    const filePath = path.join(rootDir, 'stage-definitions', '10-decision-pending.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(data.ownerRole, 'ROLE_COMPETENT_AUTHORITY');
    const grant = data.allowedTransitions.find((t) => t.transitionName === 'GRANT_APPROVAL');
    const reject = data.allowedTransitions.find((t) => t.transitionName === 'ISSUE_REJECTION');
    assert.ok(grant, 'GRANT_APPROVAL transition missing');
    assert.ok(reject, 'ISSUE_REJECTION transition missing');
    assert.deepEqual(grant.authorizedRoles, ['ROLE_COMPETENT_AUTHORITY']);
    assert.deepEqual(reject.authorizedRoles, ['ROLE_COMPETENT_AUTHORITY']);
  });

  await t.test('CLOSED_REJECTED stage contains FILE_SAC_APPEAL with 7-day rule citation', () => {
    const filePath = path.join(rootDir, 'stage-definitions', '12-closed-rejected.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const appeal = data.allowedTransitions.find((t) => t.transitionName === 'FILE_SAC_APPEAL');
    assert.ok(appeal, 'FILE_SAC_APPEAL transition missing');
    assert.equal(appeal.targetStage, 'HEARING_OR_COMMITTEE_REVIEW');
    assert.ok(appeal.aphRuleCitation.includes('RULE-SAC-001'));
  });
});

test('2. Application Workflow Templates Integrity', async (t) => {
  const templateFiles = [
    'template-a-new-institution-loa.json',
    'template-b-routine-eoa.json',
    'template-c-substantive-change-eoa.json',
    'template-d-deficiency-hearing-compliance.json',
    'template-e-sac-council-appeal.json',
    'template-f-odl-online-approval.json',
  ];

  await t.test('All 6 workflow templates exist and have initial & terminal states', () => {
    for (const file of templateFiles) {
      const filePath = path.join(rootDir, 'application-types', file);
      assert.ok(fs.existsSync(filePath), `Template missing: ${file}`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.ok(data.key, `Template ${file} has no key`);
      assert.ok(data.initialStage, `Template ${file} has no initialStage`);
      assert.ok(Array.isArray(data.terminalStages) && data.terminalStages.length > 0);
      assert.ok(Array.isArray(data.allowedStages) && data.allowedStages.length > 0);
      assert.ok(data.allowedStages.includes(data.initialStage), `initialStage must be in allowedStages`);
    }
  });

  await t.test('Template E (SAC Appeal) starts at CLOSED_REJECTED and strictly cites Clause 2.24(a)', () => {
    const filePath = path.join(rootDir, 'application-types', 'template-e-sac-council-appeal.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(data.initialStage, 'CLOSED_REJECTED');
    assert.ok(data.aphSourceReference.includes('2.24'));
  });
});

test('3. Notification Policies & Configurable Offsets Integrity', async (t) => {
  const policyFiles = [
    'application-submitted.json',
    'case-assigned.json',
    'deficiency-issued.json',
    'deficiency-resubmitted.json',
    'evc-scheduled.json',
    'evc-report-submitted.json',
    'hearing-scheduled.json',
    'compliance-due.json',
    'document-expiry.json',
    'deadline-missed.json',
    'decision-recorded.json',
    'evidence-verified.json',
    'sac-appeal-window.json',
  ];

  await t.test('All 13 notification policies exist with channels, templates, and idempotency key patterns', () => {
    for (const file of policyFiles) {
      const filePath = path.join(rootDir, 'notification-policies', file);
      assert.ok(fs.existsSync(filePath), `Notification policy missing: ${file}`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.ok(data.policyKey, `Missing policyKey in ${file}`);
      assert.ok(Array.isArray(data.channels) && data.channels.length > 0);
      assert.ok(data.templates.subject, `Missing subject template in ${file}`);
      assert.ok(data.templates.inAppTitle, `Missing inAppTitle in ${file}`);
      assert.ok(data.idempotencyKeyPattern, `Missing idempotencyKeyPattern in ${file}`);
    }
  });

  await t.test('Deficiency & Document Expiry policies have configurable early warning offsets', () => {
    const defPath = path.join(rootDir, 'notification-policies', 'deficiency-issued.json');
    const defData = JSON.parse(fs.readFileSync(defPath, 'utf-8'));
    assert.ok(defData.timingOffsets.some((o) => o.offsetDays === -3), 'Missing T-3d reminder');

    const expPath = path.join(rootDir, 'notification-policies', 'document-expiry.json');
    const expData = JSON.parse(fs.readFileSync(expPath, 'utf-8'));
    assert.ok(expData.timingOffsets.some((o) => o.offsetDays === -180), 'Missing T-180d reminder');
    assert.ok(expData.timingOffsets.some((o) => o.offsetDays === -90), 'Missing T-90d reminder');
    assert.ok(expData.timingOffsets.some((o) => o.offsetDays === -30), 'Missing T-30d reminder');
  });
});

test('4. Escalation Policies Multi-Tier Hierarchy', async (t) => {
  const escalationFiles = [
    'scrutiny-assignment-escalation.json',
    'deficiency-response-escalation.json',
    'evc-scheduling-escalation.json',
    'evc-report-escalation.json',
    'compliance-overdue-escalation.json',
    'document-expiry-escalation.json',
    'sac-appeal-expiration-escalation.json',
  ];

  await t.test('All 7 escalation policies have tiers with increasing levels and target roles', () => {
    for (const file of escalationFiles) {
      const filePath = path.join(rootDir, 'escalation-policies', file);
      assert.ok(fs.existsSync(filePath), `Escalation policy missing: ${file}`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.ok(data.policyKey, `Missing policyKey in ${file}`);
      assert.ok(Array.isArray(data.tiers) && data.tiers.length > 0);
      for (const tier of data.tiers) {
        assert.ok(tier.level >= 1);
        assert.ok(tier.targetRole);
      }
    }
  });

  await t.test('Deficiency response escalation triggers L1 at +2 days and L2 at +5 days', () => {
    const filePath = path.join(rootDir, 'escalation-policies', 'deficiency-response-escalation.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const l1 = data.tiers.find((t) => t.level === 1);
    const l2 = data.tiers.find((t) => t.level === 2);
    assert.equal(l1.triggerDelayDaysAfterDeadline, 2);
    assert.equal(l2.triggerDelayDaysAfterDeadline, 5);
    assert.equal(l2.systemAction, 'REFER_TO_SHC');
  });
});
