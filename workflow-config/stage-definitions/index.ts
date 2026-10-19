/**
 * Stage Definitions Registry
 * Authoritative registry of all workflow states in AICTE FlowGuard
 */

import type { StageDefinition, StageKey } from '../types.ts';

import draftStage from './01-draft.json' with { type: 'json' };
import submittedStage from './02-submitted.json' with { type: 'json' };
import scrutinyStage from './03-scrutiny.json' with { type: 'json' };
import deficiencyResponseStage from './04-deficiency-response.json' with { type: 'json' };
import reScrutinyStage from './05-re-scrutiny.json' with { type: 'json' };
import evcPendingStage from './06-evc-pending.json' with { type: 'json' };
import evcScheduledStage from './07-evc-scheduled.json' with { type: 'json' };
import evcReviewStage from './08-evc-review.json' with { type: 'json' };
import hearingReviewStage from './09-hearing-or-committee-review.json' with { type: 'json' };
import decisionPendingStage from './10-decision-pending.json' with { type: 'json' };
import closedApprovedStage from './11-closed-approved.json' with { type: 'json' };
import closedRejectedStage from './12-closed-rejected.json' with { type: 'json' };

export const STAGE_DEFINITIONS: Record<StageKey, StageDefinition> = {
  DRAFT: draftStage as unknown as StageDefinition,
  SUBMITTED: submittedStage as unknown as StageDefinition,
  SCRUTINY: scrutinyStage as unknown as StageDefinition,
  DEFICIENCY_RESPONSE: deficiencyResponseStage as unknown as StageDefinition,
  RE_SCRUTINY: reScrutinyStage as unknown as StageDefinition,
  EVC_PENDING: evcPendingStage as unknown as StageDefinition,
  EVC_SCHEDULED: evcScheduledStage as unknown as StageDefinition,
  EVC_REVIEW: evcReviewStage as unknown as StageDefinition,
  HEARING_OR_COMMITTEE_REVIEW: hearingReviewStage as unknown as StageDefinition,
  DECISION_PENDING: decisionPendingStage as unknown as StageDefinition,
  CLOSED_APPROVED: closedApprovedStage as unknown as StageDefinition,
  CLOSED_REJECTED: closedRejectedStage as unknown as StageDefinition,
};

export function getStageDefinition(key: StageKey): StageDefinition {
  const stage = STAGE_DEFINITIONS[key];
  if (!stage) {
    throw new Error(`Unknown stage definition key: ${key}`);
  }
  return stage;
}

export function getAllStageKeys(): StageKey[] {
  return Object.keys(STAGE_DEFINITIONS) as StageKey[];
}
