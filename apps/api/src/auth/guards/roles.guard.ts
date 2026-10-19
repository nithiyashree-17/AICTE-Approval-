import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied: Authentication required');
    }

    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);

    // Human Decision Safeguard (Section 8.2 & Section 4):
    // System Administrator does not inherit statutory authority powers
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required roles [${requiredRoles.join(', ')}]. You hold [${userRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
