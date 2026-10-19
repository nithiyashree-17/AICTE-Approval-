/**
 * AICTE FlowGuard - Authoritative Workflow State Machine & Transition Engine
 * Enforces RBAC permissions, multi-tenant scopes, stage prerequisites,
 * statutory safeguards, and generates transactional outbox events.
 */

import type {
  StageKey,
  Role,
  UserContext,
  ApplicationContext,
  TransitionRequest,
  TransitionValidationResult,
  TransitionDefinition,
} from './types.ts';
import { getStageDefinition } from './stage-definitions/index.ts';
import { getWorkflowByCategory } from './application-types/index.ts';
import { DeadlineCalculator } from './deadline-calculator.ts';

export interface AvailableAction {
  transitionName: string;
  targetStage: StageKey;
  buttonLabel: string;
  requiresEvidence: boolean;
  requiresReason: boolean;
  isPermittedForUser: boolean;
  denialReason?: string;
}

export class WorkflowEngine {
  /**
   * Computes available transitions for a given application state and user context.
   * Powers the GET /applications/:id/available-actions API endpoint.
   */
  public static getAvailableTransitions(
    currentStage: StageKey,
    user: UserContext,
    context: ApplicationContext
  ): AvailableAction[] {
    const stageDef = getStageDefinition(currentStage);
    const workflow = getWorkflowByCategory(context.applicationCategory);

    // Filter transitions allowed in this active workflow template
    const allowedInWorkflow = stageDef.allowedTransitions.filter((transition) =>
      workflow.allowedStages.includes(transition.targetStage)
    );

    return allowedInWorkflow.map((transition) => {
      const authResult = this.checkAuthorization(transition, user, context);
      return {
        transitionName: transition.transitionName,
        targetStage: transition.targetStage,
        buttonLabel: transition.buttonLabel,
        requiresEvidence: transition.requiresEvidence,
        requiresReason: transition.requiresReason,
        isPermittedForUser: authResult.isValid,
        denialReason: authResult.reason,
      };
    });
  }

  /**
   * Validates and executes a transition attempt against all regulatory rules, RBAC,
   * scope boundaries, evidence requirements, and human decision safeguards.
   */
  public static validateTransition(
    currentStage: StageKey,
    user: UserContext,
    context: ApplicationContext,
    request: TransitionRequest
  ): TransitionValidationResult {
    // 1. Statutory Safeguard: Reject AI-initiated decisions
    if (request.isAiInitiated) {
      if (['CLOSED_APPROVED', 'CLOSED_REJECTED'].includes(request.targetStage)) {
        return {
          isValid: false,
          currentStage,
          targetStage: request.targetStage,
          errorCode: 'AI_DECISION_PROHIBITED',
          reason: 'Statutory Safeguard Violation: AI agents are legally prohibited from approving, rejecting, or making statutory regulatory decisions under AICTE regulations.',
          denialExplanation: 'All final determinations must be explicitly executed by an authorized human Competent Authority.',
        };
      }
    }

    // 2. Validate stage existence and allowed transition from current state
    const stageDef = getStageDefinition(currentStage);
    const transition = stageDef.allowedTransitions.find((t) => t.targetStage === request.targetStage);

    if (!transition) {
      return {
        isValid: false,
        currentStage,
        targetStage: request.targetStage,
        errorCode: 'STAGE_DISALLOWED',
        reason: `Invalid State Transition: Cannot transition from stage '${currentStage}' to '${request.targetStage}'.`,
        denialExplanation: `Permitted transitions from ${currentStage} are: ${stageDef.allowedTransitions.map((t) => t.targetStage).join(', ') || 'None (Terminal Stage)'}`,
      };
    }

    // 3. Verify workflow template allows this stage
    const workflow = getWorkflowByCategory(context.applicationCategory);
    if (!workflow.allowedStages.includes(request.targetStage)) {
      return {
        isValid: false,
        currentStage,
        targetStage: request.targetStage,
        errorCode: 'STAGE_DISALLOWED',
        reason: `Stage '${request.targetStage}' is not permitted under workflow template '${workflow.name}'.`,
        denialExplanation: `Permitted stages in this workflow are: ${workflow.allowedStages.join(', ')}`,
      };
    }

    // 4. Role Authorization Check
    const authCheck = this.checkAuthorization(transition, user, context);
    if (!authCheck.isValid) {
      return {
        isValid: false,
        currentStage,
        targetStage: request.targetStage,
        errorCode: authCheck.errorCode,
        reason: authCheck.reason,
        denialExplanation: authCheck.denialExplanation,
      };
    }

    // 5. Evidence Requirements Check
    if (transition.requiresEvidence) {
      if (transition.requiredEvidenceTypes && transition.requiredEvidenceTypes.length > 0) {
        const uploaded = request.documentTypesUploaded || context.uploadedDocumentTypes || [];
        const missing = transition.requiredEvidenceTypes.filter((reqType) => !uploaded.includes(reqType));

        if (missing.length > 0) {
          return {
            isValid: false,
            currentStage,
            targetStage: request.targetStage,
            errorCode: 'MISSING_EVIDENCE',
            reason: `Mandatory evidence missing for transition '${transition.transitionName}'.`,
            denialExplanation: `The following required document types must be uploaded: ${missing.join(', ')}`,
          };
        }
      }
    }

    // 6. Mandatory Reason Check
    if (transition.requiresReason && (!request.reason || request.reason.trim().length === 0)) {
      return {
        isValid: false,
        currentStage,
        targetStage: request.targetStage,
        errorCode: 'PREREQUISITE_FAILED',
        reason: `A formal explanatory justification/reason is mandatory for transition '${transition.transitionName}'.`,
        denialExplanation: 'Regulatory audit rules require an explicit documented reason for this action.',
      };
    }

    // 7. Special Statutory Rule: SAC Appeal 7-Day Window Check (APH Clause 2.24(a))
    if (transition.transitionName === 'FILE_SAC_APPEAL') {
      if (!context.decisionUploadedAt) {
        return {
          isValid: false,
          currentStage,
          targetStage: request.targetStage,
          errorCode: 'PREREQUISITE_FAILED',
          reason: 'Cannot file SAC appeal: No rejection decision upload timestamp recorded on case.',
        };
      }

      const isWithinLimit = DeadlineCalculator.isSacAppealWithinStatutoryLimit(
        context.decisionUploadedAt,
        request.evidencePayload?.appealSubmittedAt as string || new Date()
      );

      if (!isWithinLimit) {
        const deadline = DeadlineCalculator.calculateSacAppealDeadline(context.decisionUploadedAt);
        return {
          isValid: false,
          currentStage,
          targetStage: request.targetStage,
          errorCode: 'TIME_LIMIT_EXCEEDED',
          reason: `Appeal Barred by Limitation: Under APH Clause 2.24(a), an appeal to the Standing Appellate Committee must be lodged within strictly 7 calendar days of decision upload.`,
          denialExplanation: `Statutory cutoff expired on ${deadline.dueTimestamp}. Administrative appeal remedy is extinguished.`,
        };
      }
    }

    // Transition Passed All Checks!
    return {
      isValid: true,
      currentStage,
      targetStage: request.targetStage,
      generatedOutboxEvent: transition.sideEffects?.createOutboxEvent,
      sideEffects: transition.sideEffects,
    };
  }

  /**
   * Internal helper evaluating role and multi-tenant scoping rules
   */
  private static checkAuthorization(
    transition: TransitionDefinition,
    user: UserContext,
    context: ApplicationContext
  ): { isValid: boolean; errorCode?: TransitionValidationResult['errorCode']; reason?: string; denialExplanation?: string } {
    // 1. Auditor Safeguard: Strictly read-only across all workflows and transitions
    if (user.role === 'ROLE_AUDITOR') {
      return {
        isValid: false,
        errorCode: 'ROLE_FORBIDDEN',
        reason: 'Auditor Immutability: Auditors possess read-only privileges across all scopes and cannot execute workflow mutations.',
      };
    }

    // 2. System Administrator Safeguard: Zero statutory decision authority
    if (user.role === 'ROLE_SYSTEM_ADMIN') {
      if (['GRANT_APPROVAL', 'ISSUE_REJECTION'].includes(transition.transitionName)) {
        return {
          isValid: false,
          errorCode: 'ROLE_FORBIDDEN',
          reason: 'System Administrator Firewall: System Administrators are programmatically prohibited from making statutory approval or rejection decisions.',
          denialExplanation: 'Statutory decisions must be made exclusively by authenticated Competent Authority personnel.',
        };
      }
    }

    // 3. Check if user's role is in the authorized roles list
    if (!transition.authorizedRoles.includes(user.role)) {
      return {
        isValid: false,
        errorCode: 'ROLE_FORBIDDEN',
        reason: `Role '${user.role}' is not authorized to execute transition '${transition.transitionName}'.`,
        denialExplanation: `Authorized role(s) for this action: ${transition.authorizedRoles.join(', ')}`,
      };
    }

    // Multi-tenant Scoping Boundaries:
    // 4. Institution scope: Institution users can ONLY act on their own institution's cases
    if (user.role === 'ROLE_INSTITUTION') {
      if (user.institutionId !== context.institutionId) {
        return {
          isValid: false,
          errorCode: 'SCOPE_VIOLATION',
          reason: 'Cross-Tenant Access Violation: You cannot perform actions on applications belonging to another institution.',
          denialExplanation: `User institutionId '${user.institutionId}' does not match case institutionId '${context.institutionId}'.`,
        };
      }
    }

    // 5. Regional scope: Regional officers can only act within their assigned region
    if (user.role === 'ROLE_REGIONAL_OFFICER') {
      if (user.regionId && user.regionId !== context.regionId) {
        return {
          isValid: false,
          errorCode: 'SCOPE_VIOLATION',
          reason: 'Cross-Region Access Violation: Regional Officers can only act on applications within their assigned region.',
          denialExplanation: `User regionId '${user.regionId}' does not match case regionId '${context.regionId}'.`,
        };
      }
    }

    // 6. Scrutiny Officer scope: Must be assigned to this specific case
    if (user.role === 'ROLE_SCRUTINY_OFFICER') {
      if (context.assignedOfficerId && context.assignedOfficerId !== user.userId) {
        return {
          isValid: false,
          errorCode: 'SCOPE_VIOLATION',
          reason: 'Unassigned Case Violation: You can only evaluate cases assigned directly to your scrutiny queue.',
          denialExplanation: `Case is currently assigned to officer '${context.assignedOfficerId}'.`,
        };
      }
    }

    // 7. EVC Member scope: Must be an appointed member of this specific EVC event
    if (user.role === 'ROLE_EVC_MEMBER') {
      if (context.evcEventId && user.assignedEvcEventIds && !user.assignedEvcEventIds.includes(context.evcEventId)) {
        return {
          isValid: false,
          errorCode: 'SCOPE_VIOLATION',
          reason: 'Committee Scope Violation: You are not an appointed member of the inspection committee for this case.',
          denialExplanation: `User is not on the roster for EVC event '${context.evcEventId}'.`,
        };
      }
    }

    return { isValid: true };
  }
}
