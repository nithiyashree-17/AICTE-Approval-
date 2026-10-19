/**
 * Application Types Registry
 * Authoritative registry of all approval pathways in AICTE FlowGuard
 */

import type { ApplicationCategory, WorkflowDefinition } from '../types.ts';

import templateALoA from './template-a-new-institution-loa.json' with { type: 'json' };
import templateBEoA from './template-b-routine-eoa.json' with { type: 'json' };
import templateCSubstantive from './template-c-substantive-change-eoa.json' with { type: 'json' };
import templateDHearing from './template-d-deficiency-hearing-compliance.json' with { type: 'json' };
import templateESACAppeal from './template-e-sac-council-appeal.json' with { type: 'json' };
import templateFODL from './template-f-odl-online-approval.json' with { type: 'json' };

export const WORKFLOW_TEMPLATES: Record<string, WorkflowDefinition> = {
  TEMPLATE_A_NEW_INSTITUTION_LOA: templateALoA as unknown as WorkflowDefinition,
  TEMPLATE_B_ROUTINE_EOA: templateBEoA as unknown as WorkflowDefinition,
  TEMPLATE_C_SUBSTANTIVE_CHANGE_EOA: templateCSubstantive as unknown as WorkflowDefinition,
  TEMPLATE_D_DEFICIENCY_HEARING_COMPLIANCE: templateDHearing as unknown as WorkflowDefinition,
  TEMPLATE_E_SAC_COUNCIL_APPEAL: templateESACAppeal as unknown as WorkflowDefinition,
  TEMPLATE_F_ODL_ONLINE_APPROVAL: templateFODL as unknown as WorkflowDefinition,
};

export const CATEGORY_TO_WORKFLOW_MAP: Record<ApplicationCategory, string> = {
  NEW_INSTITUTION: 'TEMPLATE_A_NEW_INSTITUTION_LOA',
  ROUTINE_EOA: 'TEMPLATE_B_ROUTINE_EOA',
  SUBSTANTIVE_CHANGE_EOA: 'TEMPLATE_C_SUBSTANTIVE_CHANGE_EOA',
  DEFICIENCY_HEARING_COMPLIANCE: 'TEMPLATE_D_DEFICIENCY_HEARING_COMPLIANCE',
  SAC_COUNCIL_APPEAL: 'TEMPLATE_E_SAC_COUNCIL_APPEAL',
  ODL_ONLINE_APPROVAL: 'TEMPLATE_F_ODL_ONLINE_APPROVAL',
};

export function getWorkflowDefinition(key: string): WorkflowDefinition {
  const workflow = WORKFLOW_TEMPLATES[key];
  if (!workflow) {
    throw new Error(`Unknown workflow definition key: ${key}`);
  }
  return workflow;
}

export function getWorkflowByCategory(category: ApplicationCategory): WorkflowDefinition {
  const key = CATEGORY_TO_WORKFLOW_MAP[category];
  if (!key) {
    throw new Error(`No workflow registered for category: ${category}`);
  }
  return getWorkflowDefinition(key);
}

export function getAllWorkflowTemplates(): WorkflowDefinition[] {
  return Object.values(WORKFLOW_TEMPLATES);
}
