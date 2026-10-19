import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface TransitionPayload {
  applicationId: string;
  targetStage: string;
  actorId: string;
  actorRole: RoleType;
  actorRegion?: string;
  reason?: string;
  evidenceMetadata?: any;
}

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  /**
   * Deterministic Stage Transition Table
   * Maps current state -> allowed next states and permitted roles
   */
  private readonly stageTransitionMatrix: Record<
    string,
    { target: string; roles: RoleType[]; requiresReason?: boolean }[]
  > = {
    DRAFT: [
      { target: 'SUBMITTED', roles: [RoleType.INSTITUTION] },
    ],
    SUBMITTED: [
      { target: 'SCRUTINY', roles: [RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.SYSTEM_ADMINISTRATOR] },
      { target: 'RETURNED', roles: [RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER], requiresReason: true },
    ],
    SCRUTINY: [
      { target: 'DEFICIENCY_RESPONSE', roles: [RoleType.SCRUTINY_OFFICER], requiresReason: true },
      { target: 'EVC_PENDING', roles: [RoleType.SCRUTINY_OFFICER, RoleType.REGIONAL_OFFICER] },
      { target: 'DECISION_PENDING', roles: [RoleType.SCRUTINY_OFFICER, RoleType.REGIONAL_OFFICER] }, // Direct path for routine EoA
    ],
    DEFICIENCY_RESPONSE: [
      { target: 'RE_SCRUTINY', roles: [RoleType.INSTITUTION] },
    ],
    RE_SCRUTINY: [
      { target: 'EVC_PENDING', roles: [RoleType.SCRUTINY_OFFICER] },
      { target: 'HEARING_OR_COMMITTEE_REVIEW', roles: [RoleType.SCRUTINY_OFFICER], requiresReason: true },
      { target: 'DECISION_PENDING', roles: [RoleType.SCRUTINY_OFFICER] },
      { target: 'REJECTED', roles: [RoleType.SCRUTINY_OFFICER, RoleType.COMPETENT_AUTHORITY], requiresReason: true },
    ],
    EVC_PENDING: [
      { target: 'EVC_SCHEDULED', roles: [RoleType.EVC_COORDINATOR, RoleType.REGIONAL_OFFICER] },
    ],
    EVC_SCHEDULED: [
      { target: 'EVC_REVIEW', roles: [RoleType.EVC_MEMBER, RoleType.EVC_COORDINATOR] },
    ],
    EVC_REVIEW: [
      { target: 'DECISION_PENDING', roles: [RoleType.EVC_COORDINATOR, RoleType.REGIONAL_OFFICER] },
      { target: 'HEARING_OR_COMMITTEE_REVIEW', roles: [RoleType.REGIONAL_OFFICER], requiresReason: true },
    ],
    HEARING_OR_COMMITTEE_REVIEW: [
      { target: 'DECISION_PENDING', roles: [RoleType.SAC_SHC] },
    ],
    DECISION_PENDING: [
      // Only COMPETENT_AUTHORITY can make the final statutory decision (Section 4 & 8.2)
      { target: 'APPROVED', roles: [RoleType.COMPETENT_AUTHORITY], requiresReason: true },
      { target: 'REJECTED', roles: [RoleType.COMPETENT_AUTHORITY], requiresReason: true },
    ],
  };

  /**
   * Get valid next stages for an application given the user's role
   */
  getAvailableTransitions(currentState: string, userRole: RoleType) {
    const transitions = this.stageTransitionMatrix[currentState] || [];
    return transitions.filter((t) => t.roles.includes(userRole));
  }

  /**
   * Executes an atomic stage transition inside a PostgreSQL transaction:
   * 1. Validates transition rules and permissions
   * 2. Updates Application currentState
   * 3. Appends ApplicationStageHistory
   * 4. Appends AuditLog
   * 5. Inserts OutboxEvent
   */
  async executeTransition(payload: TransitionPayload) {
    const { applicationId, targetStage, actorId, actorRole, reason, evidenceMetadata } = payload;

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { institution: true, deficiencies: true },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    const currentState = application.currentState;
    const allowedTargets = this.stageTransitionMatrix[currentState] || [];
    const validTransition = allowedTargets.find((t) => t.target === targetStage);

    if (!validTransition) {
      throw new BadRequestException(
        `Invalid stage transition: cannot move from '${currentState}' to '${targetStage}'`,
      );
    }

    if (!validTransition.roles.includes(actorRole)) {
      throw new ForbiddenException(
        `Role '${actorRole}' is not authorized to transition from '${currentState}' to '${targetStage}'`,
      );
    }

    if (validTransition.requiresReason && (!reason || reason.trim().length === 0)) {
      throw new BadRequestException(`A documented reason is mandatory when transitioning to '${targetStage}'`);
    }

    // Deficiency guard: cannot move forward to EVC or Decision if there are unresolved deficiencies
    if (['EVC_PENDING', 'DECISION_PENDING'].includes(targetStage)) {
      const openDeficiencies = application.deficiencies.filter((d) => d.status === 'RAISED');
      if (openDeficiencies.length > 0) {
        throw new BadRequestException(
          `Cannot proceed to ${targetStage}: Application has ${openDeficiencies.length} unresolved deficiencies`,
        );
      }
    }

    const idempotencyKey = `transition-${applicationId}-${currentState}-${targetStage}-${Date.now()}`;

    // Execute atomic PostgreSQL transaction (Section 5.1 & Section 6)
    return this.prisma.$transaction(async (tx) => {
      // 1. Update application state
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: {
          currentState: targetStage,
          updatedAt: new Date(),
        },
      });

      // 2. Append stage history
      const stageHistory = await tx.applicationStageHistory.create({
        data: {
          applicationId,
          fromState: currentState,
          toState: targetStage,
          actorId,
          reason,
          workflowVersion: application.workflowVersion,
        },
      });

      // 3. Append immutable audit log
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'APPLICATION_STAGE_TRANSITION',
          resourceType: 'APPLICATION',
          resourceId: applicationId,
          changesBefore: { currentState },
          changesAfter: { currentState: targetStage },
        },
      });

      // 4. Insert transactional outbox event
      const outboxEvent = await tx.outboxEvent.create({
        data: {
          aggregateType: 'APPLICATION',
          aggregateId: applicationId,
          eventType: 'STAGE_CHANGED',
          idempotencyKey,
          payload: {
            applicationId,
            applicationNumber: application.applicationNumber,
            institutionId: application.institutionId,
            fromState: currentState,
            toState: targetStage,
            actorId,
            actorRole,
            reason,
            evidenceMetadata,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        application: updatedApplication,
        stageHistory,
        outboxEventId: outboxEvent.id,
      };
    });
  }
}
