import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObligationDto, SubmitComplianceEvidenceDto, VerifyComplianceDto } from './dto/compliance.dto';
import { RoleType } from '@prisma/client';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async createObligation(institutionId: string, actor: any, dto: CreateObligationDto) {
    return this.prisma.$transaction(async (tx) => {
      const obligation = await tx.complianceObligation.create({
        data: {
          institutionId,
          title: dto.title,
          description: dto.description,
          evidenceRequired: dto.evidenceRequired,
          dueDate: new Date(dto.dueDate),
          sourceRuleId: dto.sourceRuleId,
          status: 'OPEN',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'COMPLIANCE_OBLIGATION_CREATED',
          resourceType: 'COMPLIANCE_OBLIGATION',
          resourceId: obligation.id,
          changesAfter: { title: dto.title, dueDate: dto.dueDate },
        },
      });

      // Outbox event to register BullMQ reminders
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'COMPLIANCE',
          aggregateId: obligation.id,
          eventType: 'COMPLIANCE_CREATED',
          idempotencyKey: `compliance-created-${obligation.id}`,
          payload: {
            obligationId: obligation.id,
            institutionId,
            title: dto.title,
            dueDate: dto.dueDate,
          },
        },
      });

      return obligation;
    });
  }

  async findAll(user: any) {
    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    const where: any = {};

    if (userRoles.includes(RoleType.INSTITUTION)) {
      if (!user.institutionId) {
        throw new ForbiddenException('User has no associated institution');
      }
      where.institutionId = user.institutionId;
    } else if (userRoles.includes(RoleType.REGIONAL_OFFICER) && user.assignedRegion && user.assignedRegion !== 'GLOBAL') {
      where.institution = {
        region: user.assignedRegion,
      };
    }

    return this.prisma.complianceObligation.findMany({
      where,
      include: {
        institution: { select: { id: true, name: true, aicteCode: true, region: true } },
        submissions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async submitEvidence(obligationId: string, user: any, dto: SubmitComplianceEvidenceDto) {
    const obligation = await this.prisma.complianceObligation.findUnique({
      where: { id: obligationId },
      include: { submissions: true },
    });

    if (!obligation) {
      throw new NotFoundException(`Compliance Obligation ${obligationId} not found`);
    }

    if (obligation.institutionId !== user.institutionId) {
      throw new ForbiddenException('You cannot submit compliance for another institution');
    }

    // Version preservation: current count + 1
    const nextVersion = obligation.submissions.length + 1;

    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.complianceSubmission.create({
        data: {
          complianceId: obligationId,
          versionNumber: nextVersion,
          s3ObjectKey: dto.s3ObjectKey,
          verificationStatus: 'PENDING',
        },
      });

      await tx.complianceObligation.update({
        where: { id: obligationId },
        data: { status: 'UNDER_REVIEW' },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'COMPLIANCE_EVIDENCE_SUBMITTED',
          resourceType: 'COMPLIANCE_SUBMISSION',
          resourceId: submission.id,
          changesAfter: { versionNumber: nextVersion, s3ObjectKey: dto.s3ObjectKey },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'COMPLIANCE',
          aggregateId: obligationId,
          eventType: 'COMPLIANCE_SUBMITTED',
          idempotencyKey: `compliance-submit-${submission.id}`,
          payload: {
            obligationId,
            submissionId: submission.id,
            versionNumber: nextVersion,
          },
        },
      });

      return submission;
    });
  }

  async verifySubmission(submissionId: string, officer: any, dto: VerifyComplianceDto) {
    const submission = await this.prisma.complianceSubmission.findUnique({
      where: { id: submissionId },
      include: { obligation: true },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedSubmission = await tx.complianceSubmission.update({
        where: { id: submissionId },
        data: {
          verificationStatus: dto.status,
          reviewerNotes: dto.notes,
          verifiedById: officer.id,
          verifiedAt: new Date(),
        },
      });

      // If verified, mark obligation FULFILLED (Section 10 & COM-03)
      if (dto.status === 'VERIFIED') {
        await tx.complianceObligation.update({
          where: { id: submission.complianceId },
          data: { status: 'FULFILLED' },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: officer.id,
          action: 'COMPLIANCE_VERIFIED',
          resourceType: 'COMPLIANCE_SUBMISSION',
          resourceId: submissionId,
          changesAfter: {
            status: dto.status,
            notes: dto.notes,
          },
        },
      });

      // Emits obligation fulfilled event to cancel/suppress future reminder alerts
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'COMPLIANCE',
          aggregateId: submission.complianceId,
          eventType: dto.status === 'VERIFIED' ? 'OBLIGATION_FULFILLED' : 'COMPLIANCE_REJECTED',
          idempotencyKey: `compliance-verified-${submissionId}-${Date.now()}`,
          payload: {
            obligationId: submission.complianceId,
            status: dto.status,
            verifiedBy: officer.fullName,
          },
        },
      });

      return updatedSubmission;
    });
  }
}
