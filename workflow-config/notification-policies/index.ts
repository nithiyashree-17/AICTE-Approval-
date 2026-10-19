/**
 * Notification Policies Registry
 * Authoritative notification policies and templates for AICTE FlowGuard
 */

import type { NotificationPolicy } from '../types.ts';

import appSubmitted from './application-submitted.json' with { type: 'json' };
import caseAssigned from './case-assigned.json' with { type: 'json' };
import deficiencyIssued from './deficiency-issued.json' with { type: 'json' };
import deficiencyResubmitted from './deficiency-resubmitted.json' with { type: 'json' };
import evcScheduled from './evc-scheduled.json' with { type: 'json' };
import evcReportSubmitted from './evc-report-submitted.json' with { type: 'json' };
import hearingScheduled from './hearing-scheduled.json' with { type: 'json' };
import complianceDue from './compliance-due.json' with { type: 'json' };
import documentExpiry from './document-expiry.json' with { type: 'json' };
import deadlineMissed from './deadline-missed.json' with { type: 'json' };
import decisionRecorded from './decision-recorded.json' with { type: 'json' };
import evidenceVerified from './evidence-verified.json' with { type: 'json' };
import sacAppealWindow from './sac-appeal-window.json' with { type: 'json' };

export const NOTIFICATION_POLICIES: Record<string, NotificationPolicy> = {
  APPLICATION_SUBMITTED_RECEIPT: appSubmitted as unknown as NotificationPolicy,
  CASE_ASSIGNED_OFFICER_ALERT: caseAssigned as unknown as NotificationPolicy,
  DEFICIENCY_ISSUED_INSTITUTION_ALERT: deficiencyIssued as unknown as NotificationPolicy,
  DEFICIENCY_RESUBMITTED_OFFICER_ALERT: deficiencyResubmitted as unknown as NotificationPolicy,
  EVC_SCHEDULED_MEMBERS_AND_INSTITUTION: evcScheduled as unknown as NotificationPolicy,
  EVC_REPORT_SUBMITTED_NOTIFICATION: evcReportSubmitted as unknown as NotificationPolicy,
  HEARING_SUMMONS_NOTIFICATION: hearingScheduled as unknown as NotificationPolicy,
  COMPLIANCE_DUE_REMINDER_POLICY: complianceDue as unknown as NotificationPolicy,
  DOCUMENT_EXPIRY_WARNING_POLICY: documentExpiry as unknown as NotificationPolicy,
  DEADLINE_MISSED_ALERT_POLICY: deadlineMissed as unknown as NotificationPolicy,
  DECISION_RECORDED_APPROVAL_NOTICE: decisionRecorded as unknown as NotificationPolicy,
  EVIDENCE_VERIFIED_CONFIRMATION: evidenceVerified as unknown as NotificationPolicy,
  SAC_APPEAL_WINDOW_POLICY: sacAppealWindow as unknown as NotificationPolicy,
};

export function getNotificationPolicy(policyKey: string): NotificationPolicy {
  const policy = NOTIFICATION_POLICIES[policyKey];
  if (!policy) {
    throw new Error(`Unknown notification policy key: ${policyKey}`);
  }
  return policy;
}

export function getAllNotificationPolicies(): NotificationPolicy[] {
  return Object.values(NOTIFICATION_POLICIES);
}
