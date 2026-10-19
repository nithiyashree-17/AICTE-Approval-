/**
 * AICTE FlowGuard - Authoritative Workflow Configuration Types
 * Mapped to AICTE Approval Process Handbook (APH 2024-2027)
 * Problem Statement ID: 26262
 */

export type Role =
  | 'ROLE_INSTITUTION'
  | 'ROLE_REGIONAL_OFFICER'
  | 'ROLE_BUREAU_OFFICER'
  | 'ROLE_SCRUTINY_OFFICER'
  | 'ROLE_EVC_COORDINATOR'
  | 'ROLE_EVC_MEMBER'
  | 'ROLE_SAC_SHC'
  | 'ROLE_COMPETENT_AUTHORITY'
  | 'ROLE_SYSTEM_ADMIN'
  | 'ROLE_AUDITOR';

export type StageKey =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCRUTINY'
  | 'DEFICIENCY_RESPONSE'
  | 'RE_SCRUTINY'
  | 'EVC_PENDING'
  | 'EVC_SCHEDULED'
  | 'EVC_REVIEW'
  | 'HEARING_OR_COMMITTEE_REVIEW'
  | 'DECISION_PENDING'
  | 'CLOSED_APPROVED'
  | 'CLOSED_REJECTED';

export type ApplicationCategory =
  | 'NEW_INSTITUTION'
  | 'ROUTINE_EOA'
  | 'SUBSTANTIVE_CHANGE_EOA'
  | 'DEFICIENCY_HEARING_COMPLIANCE'
  | 'SAC_COUNCIL_APPEAL'
  | 'ODL_ONLINE_APPROVAL';

export type TimePolicyType = 'STATUTORY' | 'PROTOTYPE_POLICY';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';

export type EscalationLevel = 1 | 2 | 3;

export interface TimePolicy {
  type: TimePolicyType;
  durationValue: number;
  durationUnit: 'HOURS' | 'DAYS' | 'CALENDAR_DAYS' | 'WORKING_DAYS';
  aphClauseCitation?: string;
  description: string;
  warningOffsets: number[]; // e.g. [-7, -3, 0] days
  isStrictStatutoryCutoff: boolean;
}

export interface TransitionDefinition {
  transitionName: string;
  targetStage: StageKey;
  buttonLabel: string;
  authorizedRoles: Role[];
  requiresEvidence: boolean;
  requiresReason: boolean;
  requiredEvidenceTypes?: string[];
  aphRuleCitation?: string;
  validationRules?: string[];
  sideEffects?: {
    createOutboxEvent?: string;
    triggerNotificationPolicy?: string;
    triggerEscalationPolicy?: string;
    registerComplianceObligations?: boolean;
    startTimerPolicy?: string;
    cancelExistingTimers?: boolean;
  };
}

export interface EntryPrerequisite {
  code: string;
  description: string;
  requiredRole?: Role;
  mandatoryDocumentTypes?: string[];
  mandatoryChecks?: string[];
  aphClauseCitation?: string;
}

export interface ExitCondition {
  code: string;
  description: string;
  verificationCriteria: string[];
}

export interface StageDefinition {
  key: StageKey;
  displayName: string;
  description: string;
  ownerRole: Role;
  permittedRoles: Role[];
  isTerminal: boolean;
  aphClauseCitation: string;
  entryPrerequisites: EntryPrerequisite[];
  allowedTransitions: TransitionDefinition[];
  timePolicy?: TimePolicy;
  evidenceRequirements: string[];
  exitConditions: ExitCondition[];
}

export interface WorkflowDefinition {
  key: string;
  name: string;
  version: string;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'ACTIVE';
  applicationCategory: ApplicationCategory;
  aphSourceReference: string;
  description: string;
  initialStage: StageKey;
  terminalStages: StageKey[];
  allowedStages: StageKey[];
  stageOverrides?: Partial<Record<StageKey, Partial<StageDefinition>>>;
  mandatoryDocumentsOnSubmission: string[];
  statutoryConstraints: string[];
}

export interface NotificationTemplate {
  subject: string;
  inAppTitle: string;
  inAppBodyTemplate: string;
  emailSubjectTemplate: string;
  emailHtmlTemplate: string;
}

export interface NotificationPolicy {
  policyKey: string;
  triggerEvent: string;
  description: string;
  aphClauseCitation?: string;
  channels: NotificationChannel[];
  targetRoles: Role[];
  recipientScope: 'INSTITUTION_CONTACTS' | 'ASSIGNED_OFFICER' | 'COMMITTEE_MEMBERS' | 'REGIONAL_SUPERVISORS' | 'COMPETENT_AUTHORITY';
  timingOffsets: {
    offsetDays: number;
    label: string;
    description: string;
  }[];
  templates: NotificationTemplate;
  recheckCondition: {
    obligationMustBeOpen: boolean;
    caseMustBeInStages?: StageKey[];
    suppressIfResolved: boolean;
  };
  idempotencyKeyPattern: string; // e.g. "{caseId}:{policyKey}:{offset}:{recipientId}"
}

export interface EscalationTier {
  level: EscalationLevel;
  triggerDelayDaysAfterDeadline: number;
  targetRole: Role;
  description: string;
  notificationPolicyKey: string;
  actionRequired: string;
  systemAction?: 'SHOW_CAUSE_NOTICE' | 'REFER_TO_SHC' | 'AUTO_LOCK_CASE' | 'SUPERVISOR_ALERT';
}

export interface EscalationPolicy {
  policyKey: string;
  name: string;
  description: string;
  aphClauseCitation?: string;
  triggerStageOrEvent: StageKey | string;
  monitoredDeadlines: string[];
  tiers: EscalationTier[];
  autoResolutionCondition: string;
}

export interface UserContext {
  userId: string;
  role: Role;
  institutionId?: string;
  regionId?: string;
  assignedCaseIds?: string[];
  assignedEvcEventIds?: string[];
}

export interface ApplicationContext {
  id: string;
  applicationNumber: string;
  applicationCategory: ApplicationCategory;
  currentStage: StageKey;
  institutionId: string;
  regionId: string;
  assignedOfficerId?: string;
  evcEventId?: string;
  createdAt: string;
  submittedAt?: string;
  decisionUploadedAt?: string;
  uploadedDocumentTypes: string[];
  activeDeficienciesCount: number;
  clearedDeficienciesCount: number;
  evcReportSubmitted: boolean;
  shcRecommendationRecorded: boolean;
  appealSubmittedAt?: string;
}

export interface TransitionRequest {
  targetStage: StageKey;
  reason?: string;
  evidencePayload?: Record<string, unknown>;
  documentTypesUploaded?: string[];
  isAiInitiated?: boolean; // Safeguard: AI cannot execute statutory decisions
}

export interface TransitionValidationResult {
  isValid: boolean;
  currentStage: StageKey;
  targetStage: StageKey;
  reason?: string;
  errorCode?: 'ROLE_FORBIDDEN' | 'SCOPE_VIOLATION' | 'STAGE_DISALLOWED' | 'PREREQUISITE_FAILED' | 'MISSING_EVIDENCE' | 'TIME_LIMIT_EXCEEDED' | 'AI_DECISION_PROHIBITED';
  denialExplanation?: string;
  generatedOutboxEvent?: string;
  sideEffects?: TransitionDefinition['sideEffects'];
}
