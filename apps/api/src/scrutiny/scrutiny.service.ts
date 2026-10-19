import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeficiencyDto, RespondDeficiencyDto } from './dto/deficiency.dto';
import { RoleType } from '@prisma/client';

@Injectable()
export class ScrutinyService {
  constructor(private prisma: PrismaService) {}

  async createDeficiency(applicationId: string, actor: any, dto: CreateDeficiencyDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { institution: true },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    if (!['SCRUTINY', 'RE_SCRUTINY'].includes(application.currentState)) {
      throw new BadRequestException(
        `Deficiencies can only be raised during SCRUTINY or RE_SCRUTINY stages (current: ${application.currentState})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const deficiency = await tx.deficiency.create({
        data: {
          applicationId,
          clauseReference: dto.clauseReference,
          observation: dto.observation,
          requiredCorrection: dto.requiredCorrection,
          createdById: actor.id,
          status: 'RAISED',
        },
      });

      // Immutable audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'DEFICIENCY_RAISED',
          resourceType: 'DEFICIENCY',
          resourceId: deficiency.id,
          changesAfter: {
            applicationId,
            clauseReference: dto.clauseReference,
            observation: dto.observation,
          },
        },
      });

      // Outbox event for worker to alert institution
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'DEFICIENCY',
          aggregateId: deficiency.id,
          eventType: 'DEFICIENCY_ISSUED',
          idempotencyKey: `deficiency-issued-${deficiency.id}`,
          payload: {
            deficiencyId: deficiency.id,
            applicationId,
            applicationNumber: application.applicationNumber,
            institutionId: application.institutionId,
            observation: dto.observation,
            requiredCorrection: dto.requiredCorrection,
            raisedBy: actor.fullName,
          },
        },
      });

      return deficiency;
    });
  }

  async respondDeficiency(deficiencyId: string, actor: any, dto: RespondDeficiencyDto) {
    const deficiency = await this.prisma.deficiency.findUnique({
      where: { id: deficiencyId },
      include: { application: true },
    });

    if (!deficiency) {
      throw new NotFoundException(`Deficiency with ID ${deficiencyId} not found`);
    }

    // Ensure the responding user belongs to the institution
    if (deficiency.application.institutionId !== actor.institutionId) {
      throw new ForbiddenException('You can only respond to deficiencies raised against your own institution');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deficiency.update({
        where: { id: deficiencyId },
        data: {
          institutionResponse: dto.institutionResponse,
          responseSubmittedAt: new Date(),
          status: 'RESPONSE_SUBMITTED',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'DEFICIENCY_RESPONSE_SUBMITTED',
          resourceType: 'DEFICIENCY',
          resourceId: deficiencyId,
          changesAfter: { response: dto.institutionResponse },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'DEFICIENCY',
          aggregateId: deficiencyId,
          eventType: 'DEFICIENCY_RESPONDED',
          idempotencyKey: `deficiency-responded-${deficiencyId}-${Date.now()}`,
          payload: {
            deficiencyId,
            applicationId: deficiency.applicationId,
            response: dto.institutionResponse,
          },
        },
      });

      return updated;
    });
  }

  async resolveDeficiency(deficiencyId: string, actor: any, resolution: 'RESOLVED' | 'REJECTED') {
    const deficiency = await this.prisma.deficiency.findUnique({
      where: { id: deficiencyId },
    });

    if (!deficiency) {
      throw new NotFoundException(`Deficiency with ID ${deficiencyId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deficiency.update({
        where: { id: deficiencyId },
        data: {
          status: resolution,
          resolvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: `DEFICIENCY_${resolution}`,
          resourceType: 'DEFICIENCY',
          resourceId: deficiencyId,
          changesAfter: { status: resolution },
        },
      });

      return updated;
    });
  }

  async getDeficiencies(applicationId: string) {
    return this.prisma.deficiency.findMany({
      where: { applicationId },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
