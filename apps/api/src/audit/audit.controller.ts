import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Audit Trail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  @Roles(RoleType.AUDITOR, RoleType.SYSTEM_ADMINISTRATOR, RoleType.REGIONAL_OFFICER, RoleType.COMPETENT_AUTHORITY)
  @ApiOperation({ summary: 'Query immutable append-only audit logs with filters' })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  getAuditLogs(
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    return this.auditService.getAuditLogs({
      resourceType,
      resourceId,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }
}
