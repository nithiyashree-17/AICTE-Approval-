import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LodgeAppealDto, ScheduleHearingDto, RecordRecommendationDto } from './dto/committee.dto';
import { RoleType } from '../common/enums';

@Injectable()
export class CommitteesService {
  constructor(private prisma: PrismaService) {}

  async lodgeAppeal(applicationId: string, user: any, dto: LodgeAppealDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { stageHistory: { orderBy: { timestamp: 'desc' }, take: 1 } },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    if (application.institutionId !== user.institutionId) {
      throw new ForbiddenException('Cannot lodge appeal for another institution');
    }

    // APH Clause 2.24(a) check: Must be appealed within 7 days of decision upload
    const lastStage = application.stageHistory[0];
    if (lastStage && lastStage.toState === 'REJECTED') {
      const decisionDate = new Date(lastStage.timestamp).getTime();
      const now = Date.now();
      const diffDays = (now - decisionDate) / (1000 * 60 * 60 * 24);

      if (diffDays > 7) {
        throw new BadRequestException(
          `Statutory Appeal Window Expired: Under APH Clause 2.24(a), appeals must be filed within 7 days of the decision (Elapsed: ${Math.floor(
            diffDays,
          )} days).`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Transition application to HEARING_OR_COMMITTEE_REVIEW
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          currentState: 'HEARING_OR_COMMITTEE_REVIEW',
          type: 'APPEAL_SAC',
          updatedAt: new Date(),
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId,
          fromState: application.currentState,
          toState: 'HEARING_OR_COMMITTEE_REVIEW',
          actorId: user.id,
          reason: `SAC Appeal Lodged: ${dto.groundsOfAppeal}`,
          workflowVersion: application.workflowVersion,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'SAC_APPEAL_LODGED',
          resourceType: 'APPLICATION',
          resourceId: applicationId,
          changesAfter: { groundsOfAppeal: dto.groundsOfAppeal },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'COMMITTEE',
          aggregateId: applicationId,
          eventType: 'SAC_APPEAL_LODGED',
          idempotencyKey: `sac-appeal-${applicationId}-${Date.now()}`,
          payload: {
            applicationId,
            applicationNumber: application.applicationNumber,
            institutionId: application.institutionId,
            groundsOfAppeal: dto.groundsOfAppeal,
          },
        },
      });

      return updated;
    });
  }

  async scheduleHearing(coordinator: any, dto: ScheduleHearingDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: dto.applicationId },
        data: { currentState: 'HEARING_OR_COMMITTEE_REVIEW' },
      });

      await tx.auditLog.create({
        data: {
          actorId: coordinator.id,
          action: 'HEARING_SCHEDULED',
          resourceType: 'APPLICATION',
          resourceId: dto.applicationId,
          changesAfter: {
            hearingType: dto.hearingType,
            scheduledDate: dto.scheduledDate,
            locationOrLink: dto.locationOrLink,
          },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'COMMITTEE',
          aggregateId: dto.applicationId,
          eventType: 'HEARING_SCHEDULED',
          idempotencyKey: `hearing-sched-${dto.applicationId}-${Date.now()}`,
          payload: {
            applicationId: dto.applicationId,
            applicationNumber: application.applicationNumber,
            hearingType: dto.hearingType,
            scheduledDate: dto.scheduledDate,
            locationOrLink: dto.locationOrLink,
          },
        },
      });

      return {
        applicationId: dto.applicationId,
        hearingType: dto.hearingType,
        scheduledDate: dto.scheduledDate,
        locationOrLink: dto.locationOrLink,
        status: 'SCHEDULED',
      };
    });
  }

  async recordRecommendation(applicationId: string, member: any, dto: RecordRecommendationDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    if (application.currentState !== 'HEARING_OR_COMMITTEE_REVIEW') {
      throw new BadRequestException(
        `Recommendations can only be recorded during HEARING_OR_COMMITTEE_REVIEW stage (current: ${application.currentState})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Advance to DECISION_PENDING (Human safeguard: committee recommends, Competent Authority decides)
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { currentState: 'DECISION_PENDING' },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId,
          fromState: 'HEARING_OR_COMMITTEE_REVIEW',
          toState: 'DECISION_PENDING',
          actorId: member.id,
          reason: `Committee Recommendation: ${dto.outcome} - ${dto.observations}`,
          workflowVersion: application.workflowVersion,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: member.id,
          action: 'COMMITTEE_RECOMMENDATION_RECORDED',
          resourceType: 'APPLICATION',
          resourceId: applicationId,
          changesAfter: {
            outcome: dto.outcome,
            observations: dto.observations,
          },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'COMMITTEE',
          aggregateId: applicationId,
          eventType: 'COMMITTEE_RECOMMENDATION_RECORDED',
          idempotencyKey: `committee-rec-${applicationId}-${Date.now()}`,
          payload: {
            applicationId,
            outcome: dto.outcome,
            observations: dto.observations,
            recordedBy: member.fullName,
          },
        },
      });

      return updated;
    });
  }
}
