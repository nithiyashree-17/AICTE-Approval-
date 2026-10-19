import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommitteesService } from './committees.service';
import { LodgeAppealDto, ScheduleHearingDto, RecordRecommendationDto } from './dto/committee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Standing Committees (SHC / SAC Appeals)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('committees')
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  @Post('applications/:id/appeal')
  @Roles(RoleType.INSTITUTION)
  @ApiOperation({ summary: 'Lodge appeal to Council / SAC within statutory 7-day window (APH Cl. 2.24(a))' })
  lodgeAppeal(
    @Param('id') applicationId: string,
    @CurrentUser() user: any,
    @Body() dto: LodgeAppealDto,
  ) {
    return this.committeesService.lodgeAppeal(applicationId, user, dto);
  }

  @Post('hearings/schedule')
  @Roles(RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.SAC_SHC)
  @ApiOperation({ summary: 'Schedule formal SHC hearing or SAC appeal review' })
  scheduleHearing(
    @CurrentUser() user: any,
    @Body() dto: ScheduleHearingDto,
  ) {
    return this.committeesService.scheduleHearing(user, dto);
  }

  @Post('applications/:id/recommendations')
  @Roles(RoleType.SAC_SHC)
  @ApiOperation({ summary: 'SAC/SHC panel records hearing observations and formal recommendation' })
  recordRecommendation(
    @Param('id') applicationId: string,
    @CurrentUser() member: any,
    @Body() dto: RecordRecommendationDto,
  ) {
    return this.committeesService.recordRecommendation(applicationId, member, dto);
  }
}
