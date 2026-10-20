import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { ScopeService } from '../common/scope.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { TransitionDto } from './dto/transition.dto';
import { RoleType } from '../common/enums';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
    private scopeService: ScopeService,
  ) {}

  async createDraft(institutionId: string, actorId: string, dto: CreateApplicationDto) {
    let resolvedInstId = institutionId;
    if (!resolvedInstId) {
      const firstInst = await this.prisma.institution.findFirst();
      resolvedInstId = firstInst?.id || '';
    }
    if (!resolvedInstId) {
      throw new BadRequestException('No accredited institution found in database');
    }

    const count = await this.prisma.application.count();
    const applicationNumber = `AICTE-${dto.academicYear.substring(0, 4)}-${dto.assignedRegion.charAt(0)}-${(
      count + 1001
    ).toString()}`;

    const workflowKey = `${dto.type}_V1`;

    const application = await this.prisma.application.create({
      data: {
        applicationNumber,
        institutionId: resolvedInstId,
        type: dto.type,
        academicYear: dto.academicYear,
        currentState: 'DRAFT',
        workflowDefinitionKey: workflowKey,
        workflowVersion: 1,
        assignedRegion: dto.assignedRegion,
      },
      include: {
        institution: true,
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

  async updateDraft(id: string, user: any, updateDto: any) {
    const app = await this.prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    if (app.institutionId !== user.institutionId && user.institutionId) {
      throw new ForbiddenException("Unauthorized: Cannot modify another institution's application (SEC-01)");
    }
    if (app.currentState !== 'DRAFT') {
      throw new BadRequestException(`Application is in '${app.currentState}' state and can no longer be edited as draft`);
    }

    return this.prisma.application.update({
      where: { id: app.id },
      data: {
        academicYear: updateDto.academicYear || app.academicYear,
        updatedAt: new Date(),
      },
    });
  }

  async findAll(user: any, filters?: { status?: string; region?: string }) {
    const where = await this.scopeService.buildApplicationListFilter(user.id, filters);

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
    // DB-backed scope verification: throws 404 for out-of-scope or non-existent applications
    await this.scopeService.assertApplicationAccess(user.id, id);

    const application = await this.prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
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

    return application;
  }

  async getAvailableActions(id: string, user: any) {
    const application = await this.prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
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

    const app = await this.prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Verify ownership if institution
    if (userRoles.includes(RoleType.INSTITUTION) && user.institutionId && app.institutionId !== user.institutionId) {
      throw new ForbiddenException("Cannot modify another institution's case");
    }

    return this.workflowService.executeTransition({
      applicationId: app.id,
      targetStage: dto.targetStage,
      actorId: user.id,
      actorRole: primaryRole,
      actorRegion: user.assignedRegion,
      reason: dto.reason,
      evidenceMetadata: dto.metadata,
    });
  }

  async getTimeline(id: string) {
    const app = await this.prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      select: { id: true },
    });
    const targetId = app ? app.id : id;

    return this.prisma.applicationStageHistory.findMany({
      where: { applicationId: targetId },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }
}
