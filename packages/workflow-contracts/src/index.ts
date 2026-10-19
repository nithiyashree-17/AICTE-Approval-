/**
 * @flowguard/workflow-contracts
 * Contracts, transition interfaces, and guard condition types for the deterministic workflow engine.
 */

import { RoleType, WorkflowStageKey } from '@flowguard/shared-types';

export interface WorkflowTransitionGuard {
  requiresReason?: boolean;
  requiredDocuments?: string[];
  requiresNoOpenDeficiencies?: boolean;
  permittedRoles: RoleType[];
}

export interface WorkflowStageDefinition {
  stageKey: WorkflowStageKey;
  displayName: string;
  responsibleRole: RoleType;
  allowedTransitions: {
    targetStage: WorkflowStageKey;
    guard?: WorkflowTransitionGuard;
  }[];
  deadlineHours?: number;
}

export interface WorkflowTemplateDefinition {
  key: string;
  version: number;
  name: string;
  aphSourceReference: string;
  stages: WorkflowStageDefinition[];
}
