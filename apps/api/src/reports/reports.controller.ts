import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pendency')
  @Roles(RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.COMPETENT_AUTHORITY, RoleType.SYSTEM_ADMINISTRATOR, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Applications grouped by stage, region, and type' })
  getPendencyReport() {
    return this.reportsService.getPendencyReport();
  }

  @Get('compliance')
  @Roles(RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.COMPETENT_AUTHORITY, RoleType.SYSTEM_ADMINISTRATOR, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Compliance obligations status and upcoming/overdue counts' })
  getComplianceReport() {
    return this.reportsService.getComplianceReport();
  }

  @Get('evc')
  @Roles(RoleType.EVC_COORDINATOR, RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.SYSTEM_ADMINISTRATOR, RoleType.AUDITOR)
  @ApiOperation({ summary: 'EVC inspection statuses and modes' })
  getEvcReport() {
    return this.reportsService.getEvcReport();
  }
}
