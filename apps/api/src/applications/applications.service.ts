import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { TransitionDto } from './dto/transition.dto';
import { RoleType } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
  ) {}

  async createDraft(institutionId: string, actorId: string, dto: CreateApplicationDto) {
    if (!institutionId) {
      throw new BadRequestException('User is not associated with an accredited institution');
    }

    const count = await this.prisma.application.count();
    const applicationNumber = `AICTE-${dto.academicYear.substring(0, 4)}-${dto.assignedRegion.charAt(0)}-${(
      count + 1001
    ).toString()}`;

    const workflowKey = `${dto.type}_V1`;

    const application = await this.prisma.application.create({
      data: {
        applicationNumber,
        institutionId,
        type: dto.type,
        academicYear: dto.academicYear,
        currentState: 'DRAFT',
        workflowDefinitionKey: workflowKey,
        workflowVersion: 1,
        assignedRegion: dto.assignedRegion,
      },
    });

    // Write initial stage history
    await this.prisma.applicationStageHistory.create({
      data: {
        applicationId: application.id,
        fromState: 'NONE',
        toState: 'DRAFT',
        actorId,
        reason: 'Application draft initiated',
        workflowVersion: 1,
      },
    });

    return application;
  }

  async findAll(user: any, filters?: { status?: string; region?: string }) {
    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    const where: any = {};

    // 1. Institution scope: Only own applications
    if (userRoles.includes(RoleType.INSTITUTION)) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      where.institutionId = user.institutionId;
    }
    // 2. Regional Officer / EVC Coordinator scope: Assigned region only
    else if (
      userRoles.includes(RoleType.REGIONAL_OFFICER) ||
      (userRoles.includes(RoleType.EVC_COORDINATOR) && !userRoles.includes(RoleType.SYSTEM_ADMINISTRATOR))
    ) {
      if (user.assignedRegion && user.assignedRegion !== 'GLOBAL') {
        where.assignedRegion = user.assignedRegion;
      }
    }

    if (filters?.status) {
      where.currentState = filters.status;
    }
    if (filters?.region && (!where.assignedRegion || where.assignedRegion === 'GLOBAL')) {
      where.assignedRegion = filters.region;
    }

    return this.prisma.application.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            aicteCode: true,
            region: true,
            state: true,
          },
        },
        deficiencies: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            deficiencies: true,
            evcEvents: true,
            documents: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        institution: true,
        stageHistory: {
          include: {
            actor: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
        deficiencies: {
          include: {
            createdBy: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        evcEvents: {
          include: {
            coordinator: { select: { id: true, fullName: true } },
            assignments: {
              include: { member: { select: { id: true, fullName: true, email: true } } },
            },
            reports: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
            },
          },
        },
        obligations: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Server-side scope verification (Section 4 & Section 17)
    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    if (userRoles.includes(RoleType.INSTITUTION) && application.institutionId !== user.institutionId) {
      throw new ForbiddenException("Unauthorized: Cannot access another institution's application (SEC-01)");
    }

    return application;
  }

  async getAvailableActions(id: string, user: any) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    const primaryRole = userRoles[0];

    const actions = this.workflowService.getAvailableTransitions(application.currentState, primaryRole);
    return {
      applicationId: application.id,
      currentState: application.currentState,
      userRole: primaryRole,
      availableTransitions: actions,
    };
  }

  async transition(id: string, user: any, dto: TransitionDto) {
    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    const primaryRole = userRoles[0];

    // Verify ownership if institution
    if (userRoles.includes(RoleType.INSTITUTION)) {
      const app = await this.prisma.application.findUnique({ where: { id } });
      if (app && app.institutionId !== user.institutionId) {
        throw new ForbiddenException("Cannot modify another institution's case");
      }
    }

    return this.workflowService.executeTransition({
      applicationId: id,
      targetStage: dto.targetStage,
      actorId: user.id,
      actorRole: primaryRole,
      actorRegion: user.assignedRegion,
      reason: dto.reason,
      evidenceMetadata: dto.metadata,
    });
  }

  async getTimeline(id: string) {
    return this.prisma.applicationStageHistory.findMany({
      where: { applicationId: id },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }
}
