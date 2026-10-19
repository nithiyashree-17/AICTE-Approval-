/**
 * Escalation Policies Registry
 * Authoritative escalation policies for AICTE FlowGuard
 */

import type { EscalationPolicy } from '../types.ts';

import scrutinyAssignment from './scrutiny-assignment-escalation.json' with { type: 'json' };
import deficiencyResponse from './deficiency-response-escalation.json' with { type: 'json' };
import evcScheduling from './evc-scheduling-escalation.json' with { type: 'json' };
import evcReport from './evc-report-escalation.json' with { type: 'json' };
import complianceOverdue from './compliance-overdue-escalation.json' with { type: 'json' };
import documentExpiry from './document-expiry-escalation.json' with { type: 'json' };
import sacAppealExpiration from './sac-appeal-expiration-escalation.json' with { type: 'json' };

export const ESCALATION_POLICIES: Record<string, EscalationPolicy> = {
  SCRUTINY_ASSIGNMENT_ESCALATION: scrutinyAssignment as unknown as EscalationPolicy,
  DEFICIENCY_RESPONSE_ESCALATION: deficiencyResponse as unknown as EscalationPolicy,
  EVC_SCHEDULING_ESCALATION: evcScheduling as unknown as EscalationPolicy,
  EVC_REPORT_ESCALATION: evcReport as unknown as EscalationPolicy,
  COMPLIANCE_OVERDUE_ESCALATION: complianceOverdue as unknown as EscalationPolicy,
  DOCUMENT_EXPIRY_ESCALATION: documentExpiry as unknown as EscalationPolicy,
  SAC_APPEAL_EXPIRATION_ESCALATION: sacAppealExpiration as unknown as EscalationPolicy,
};

export function getEscalationPolicy(policyKey: string): EscalationPolicy {
  const policy = ESCALATION_POLICIES[policyKey];
  if (!policy) {
    throw new Error(`Unknown escalation policy key: ${policyKey}`);
  }
  return policy;
}

export function getAllEscalationPolicies(): EscalationPolicy[] {
  return Object.values(ESCALATION_POLICIES);
}
