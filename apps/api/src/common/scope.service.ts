import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from './enums';

export interface UserScope {
  userId: string;
  roles: RoleType[];
  institutionId?: string | null;
  assignedRegion?: string | null;
}

@Injectable()
export class ScopeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves the real-time scope directly from the database,
   * completely ignoring any stale claims that might be on the JWT token.
   */
  async resolveScope(userId: string): Promise<UserScope> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
        institution: {
          select: { id: true, region: true },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User session invalid or user deleted');
    }

    const roles: RoleType[] = user.roles.map((r: any) => (r.role?.name || r.name) as RoleType);

    return {
      userId: user.id,
      roles,
      institutionId: user.institutionId,
      assignedRegion: user.assignedRegion || user.institution?.region || null,
    };
  }

  /**
   * Asserts whether a user has authority to access an application.
   * Requirement: Return 404 NotFoundException for out-of-scope IDs (prevents enumeration / data leak).
   */
  async assertApplicationAccess(userId: string, applicationId: string) {
    const scope = await this.resolveScope(userId);

    const app = await this.prisma.application.findFirst({
      where: { OR: [{ id: applicationId }, { applicationNumber: applicationId }] },
      select: { id: true, institutionId: true, assignedRegion: true },
    });

    if (!app) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // System Administrator, Competent Authority, SAC/SHC, Bureau Officer have central/global visibility
    if (
      scope.roles.includes(RoleType.SYSTEM_ADMINISTRATOR) ||
      scope.roles.includes(RoleType.COMPETENT_AUTHORITY) ||
      scope.roles.includes(RoleType.BUREAU_OFFICER) ||
      scope.roles.includes(RoleType.SAC_SHC) ||
      scope.roles.includes(RoleType.AUDITOR)
    ) {
      return app;
    }

    // Institution role: strictly own institution only
    if (scope.roles.includes(RoleType.INSTITUTION)) {
      if (!scope.institutionId || app.institutionId !== scope.institutionId) {
        throw new NotFoundException(`Application with ID ${applicationId} not found`);
      }
      return app;
    }

    // Regional Officer / Scrutiny / EVC: strictly matching assigned region
    if (
      scope.roles.includes(RoleType.REGIONAL_OFFICER) ||
      scope.roles.includes(RoleType.SCRUTINY_OFFICER) ||
      scope.roles.includes(RoleType.EVC_COORDINATOR) ||
      scope.roles.includes(RoleType.EVC_MEMBER)
    ) {
      if (
        scope.assignedRegion &&
        scope.assignedRegion !== 'GLOBAL' &&
        app.assignedRegion !== scope.assignedRegion
      ) {
        throw new NotFoundException(`Application with ID ${applicationId} not found`);
      }
      return app;
    }

    // Default deny for unhandled roles
    throw new NotFoundException(`Application with ID ${applicationId} not found`);
  }

  /**
   * Builds the database where filter for list endpoints based on real DB scope.
   */
  async buildApplicationListFilter(userId: string, filters?: { status?: string; region?: string }) {
    const scope = await this.resolveScope(userId);
    const where: any = {};

    if (scope.roles.includes(RoleType.INSTITUTION)) {
      if (!scope.institutionId) {
        return { id: '__NONE__' }; // Empty result
      }
      where.institutionId = scope.institutionId;
    } else if (
      scope.roles.includes(RoleType.REGIONAL_OFFICER) ||
      scope.roles.includes(RoleType.SCRUTINY_OFFICER) ||
      scope.roles.includes(RoleType.EVC_COORDINATOR) ||
      scope.roles.includes(RoleType.EVC_MEMBER)
    ) {
      if (scope.assignedRegion && scope.assignedRegion !== 'GLOBAL') {
        where.assignedRegion = scope.assignedRegion;
      }
    }

    if (filters?.status) {
      where.currentState = filters.status;
    }
    if (filters?.region && (!where.assignedRegion || where.assignedRegion === 'GLOBAL')) {
      where.assignedRegion = filters.region;
    }

    return where;
  }
}
