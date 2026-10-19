import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EvcService } from './evc.service';
import { ScheduleEvcDto, SubmitEvcReportDto } from './dto/evc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Expert Visit Committee (EVC)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evc')
export class EvcController {
  constructor(private readonly evcService: EvcService) {}

  @Get('queue')
  @Roles(RoleType.EVC_COORDINATOR, RoleType.REGIONAL_OFFICER, RoleType.SYSTEM_ADMINISTRATOR, RoleType.AUDITOR)
  @ApiOperation({ summary: 'List applications waiting for EVC scheduling or report review' })
  getEvcQueue(@CurrentUser() user: any) {
    return this.evcService.getEvcQueue(user);
  }

  @Post('applications/:id/schedule')
  @Roles(RoleType.EVC_COORDINATOR, RoleType.REGIONAL_OFFICER)
  @ApiOperation({ summary: 'Schedule EVC date, mode, location, and assign committee members' })
  scheduleEvc(
    @Param('id') applicationId: string,
    @CurrentUser() user: any,
    @Body() dto: ScheduleEvcDto,
  ) {
    return this.evcService.scheduleEvc(applicationId, user, dto);
  }

  @Post('events/:id/reports')
  @Roles(RoleType.EVC_MEMBER, RoleType.EVC_COORDINATOR)
  @ApiOperation({ summary: 'Submit committee observations and inspection report' })
  submitReport(
    @Param('id') evcEventId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitEvcReportDto,
  ) {
    return this.evcService.submitReport(evcEventId, user, dto);
  }
}
