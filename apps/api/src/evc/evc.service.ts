import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleEvcDto, SubmitEvcReportDto } from './dto/evc.dto';
import { RoleType } from '@prisma/client';

@Injectable()
export class EvcService {
  constructor(private prisma: PrismaService) {}

  async getEvcQueue(user: any) {
    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    const where: any = {
      currentState: { in: ['EVC_PENDING', 'EVC_SCHEDULED', 'EVC_REVIEW'] },
    };

    if (user.assignedRegion && user.assignedRegion !== 'GLOBAL') {
      where.assignedRegion = user.assignedRegion;
    }

    return this.prisma.application.findMany({
      where,
      include: {
        institution: true,
        evcEvents: {
          include: {
            coordinator: { select: { id: true, fullName: true } },
            assignments: {
              include: { member: { select: { id: true, fullName: true, email: true } } },
            },
            reports: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async scheduleEvc(applicationId: string, coordinator: any, dto: ScheduleEvcDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    if (!['EVC_PENDING', 'EVC_SCHEDULED'].includes(application.currentState)) {
      throw new BadRequestException(
        `EVC can only be scheduled when state is EVC_PENDING or EVC_SCHEDULED (current: ${application.currentState})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create EVC Event record
      const evcEvent = await tx.evcEvent.create({
        data: {
          applicationId,
          coordinatorId: coordinator.id,
          scheduledDate: new Date(dto.scheduledDate),
          mode: dto.mode,
          locationOrLink: dto.locationOrLink,
          status: 'SCHEDULED',
        },
      });

      // 2. Assign Committee Members
      for (const m of dto.members) {
        await tx.committeeAssignment.create({
          data: {
            evcEventId: evcEvent.id,
            memberUserId: m.userId,
            assignmentRole: m.role,
            status: 'ASSIGNED',
          },
        });
      }

      // 3. Move application state to EVC_SCHEDULED
      await tx.application.update({
        where: { id: applicationId },
        data: { currentState: 'EVC_SCHEDULED' },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: coordinator.id,
          action: 'EVC_SCHEDULED',
          resourceType: 'EVC_EVENT',
          resourceId: evcEvent.id,
          changesAfter: {
            scheduledDate: dto.scheduledDate,
            mode: dto.mode,
            memberCount: dto.members.length,
          },
        },
      });

      // 5. Outbox Event (Sends alerts to institution and committee members)
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'EVC',
          aggregateId: evcEvent.id,
          eventType: 'EVC_SCHEDULED',
          idempotencyKey: `evc-scheduled-${evcEvent.id}`,
          payload: {
            evcEventId: evcEvent.id,
            applicationId,
            applicationNumber: application.applicationNumber,
            scheduledDate: dto.scheduledDate,
            mode: dto.mode,
            locationOrLink: dto.locationOrLink,
            assignedMemberIds: dto.members.map((m) => m.userId),
          },
        },
      });

      return evcEvent;
    });
  }

  async submitReport(evcEventId: string, memberUser: any, dto: SubmitEvcReportDto) {
    const evcEvent = await this.prisma.evcEvent.findUnique({
      where: { id: evcEventId },
      include: { assignments: true, application: true },
    });

    if (!evcEvent) {
      throw new NotFoundException(`EVC Event with ID ${evcEventId} not found`);
    }

    // Security Check SEC-02: Only an assigned committee member can submit an inspection report
    const isAssigned = evcEvent.assignments.some((a) => a.memberUserId === memberUser.id);
    const userRoles: RoleType[] = memberUser.roles.map((r: any) => r.role?.name || r.name);
    const isCoordinator = evcEvent.coordinatorId === memberUser.id || userRoles.includes(RoleType.EVC_COORDINATOR);

    if (!isAssigned && !isCoordinator) {
      throw new ForbiddenException('Access Denied: You are not assigned to this EVC committee (SEC-02)');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Insert report
      const report = await tx.evcReport.create({
        data: {
          evcEventId,
          submittedById: memberUser.id,
          s3ObjectKey: dto.s3ObjectKey,
          findings: dto.findings,
          reviewStatus: 'SUBMITTED',
        },
      });

      // 2. Update EVC status
      await tx.evcEvent.update({
        where: { id: evcEventId },
        data: {
          status: 'REPORT_SUBMITTED',
          completedAt: new Date(),
        },
      });

      // 3. Move Application state to EVC_REVIEW
      await tx.application.update({
        where: { id: evcEvent.applicationId },
        data: { currentState: 'EVC_REVIEW' },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: memberUser.id,
          action: 'EVC_REPORT_SUBMITTED',
          resourceType: 'EVC_REPORT',
          resourceId: report.id,
          changesAfter: {
            s3ObjectKey: dto.s3ObjectKey,
            evcEventId,
          },
        },
      });

      // 5. Outbox Event
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'EVC',
          aggregateId: evcEventId,
          eventType: 'EVC_REPORT_SUBMITTED',
          idempotencyKey: `evc-report-${report.id}`,
          payload: {
            evcReportId: report.id,
            evcEventId,
            applicationId: evcEvent.applicationId,
            submittedBy: memberUser.fullName,
          },
        },
      });

      return report;
    });
  }
}
