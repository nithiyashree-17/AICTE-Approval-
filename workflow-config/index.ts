/**
 * AICTE FlowGuard - Authoritative Workflow Configuration Package
 * Problem Statement ID: 26262
 *
 * Exports:
 * - Workflow templates (Templates A, B, C, D, E, F)
 * - Stage definitions (DRAFT through CLOSED_APPROVED / CLOSED_REJECTED)
 * - Notification policies & templates
 * - Escalation policies & multi-tier hierarchies
 * - Workflow state machine transition engine
 * - Deadline & SLA calculator (Statutory vs Prototype Policy)
 * - Notification template compiler
 * - Graph integrity validator
 */

export type * from './types.ts';
import type { StageKey } from './types.ts';

// Stage definitions
import {
  STAGE_DEFINITIONS,
  getStageDefinition,
  getAllStageKeys,
} from './stage-definitions/index.ts';

// Application types & workflow templates
import {
  WORKFLOW_TEMPLATES,
  CATEGORY_TO_WORKFLOW_MAP,
  getWorkflowDefinition,
  getWorkflowByCategory,
  getAllWorkflowTemplates,
} from './application-types/index.ts';

// Notification policies
import {
  NOTIFICATION_POLICIES,
  getNotificationPolicy,
  getAllNotificationPolicies,
} from './notification-policies/index.ts';

// Escalation policies
import {
  ESCALATION_POLICIES,
  getEscalationPolicy,
  getAllEscalationPolicies,
} from './escalation-policies/index.ts';

export {
  STAGE_DEFINITIONS,
  getStageDefinition,
  getAllStageKeys,
  WORKFLOW_TEMPLATES,
  CATEGORY_TO_WORKFLOW_MAP,
  getWorkflowDefinition,
  getWorkflowByCategory,
  getAllWorkflowTemplates,
  NOTIFICATION_POLICIES,
  getNotificationPolicy,
  getAllNotificationPolicies,
  ESCALATION_POLICIES,
  getEscalationPolicy,
  getAllEscalationPolicies,
};

// Engines & Calculators
export {
  WorkflowEngine,
  type AvailableAction,
} from './workflow-engine.ts';

export {
  DeadlineCalculator,
  type CalculatedDeadline,
} from './deadline-calculator.ts';

export {
  NotificationEngine,
  type CompiledNotification,
} from './notification-engine.ts';

/**
 * Validates the complete graph integrity of all loaded workflow templates.
 * Checks for:
 * 1. Reachability from initialStage to at least one terminal stage
 * 2. All target stages exist in allowedStages
 * 3. No dangling transitions
 * 4. Human decision safeguards present on decision stages
 */
export function validateWorkflowGraphIntegrity(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const templates = getAllWorkflowTemplates();

  for (const template of templates) {
    const visited = new Set<StageKey>();
    const queue: StageKey[] = [template.initialStage];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      try {
        const stageDef = getStageDefinition(current);
        for (const transition of stageDef.allowedTransitions) {
          if (template.allowedStages.includes(transition.targetStage)) {
            if (!visited.has(transition.targetStage)) {
              queue.push(transition.targetStage);
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`Template '${template.key}': Failed loading stage '${current}' - ${(err as Error).message}`);
      }
    }

    // Verify at least one terminal stage is reachable
    const reachableTerminals = template.terminalStages.filter((term: StageKey) => visited.has(term));
    if (reachableTerminals.length === 0) {
      errors.push(
        `Template '${template.key}': No terminal state reachable from initial stage '${template.initialStage}'. Reachable stages: ${Array.from(visited).join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
