import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScrutinyService } from './scrutiny.service';
import { CreateDeficiencyDto, RespondDeficiencyDto } from './dto/deficiency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Scrutiny & Deficiencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ScrutinyController {
  constructor(private readonly scrutinyService: ScrutinyService) {}

  @Post('applications/:id/deficiencies')
  @Roles(RoleType.SCRUTINY_OFFICER, RoleType.REGIONAL_OFFICER)
  @ApiOperation({ summary: 'Raise a technical deficiency against an application' })
  createDeficiency(
    @Param('id') applicationId: string,
    @CurrentUser() actor: any,
    @Body() dto: CreateDeficiencyDto,
  ) {
    return this.scrutinyService.createDeficiency(applicationId, actor, dto);
  }

  @Post('deficiencies/:id/respond')
  @Roles(RoleType.INSTITUTION)
  @ApiOperation({ summary: 'Institution submits response to a raised deficiency' })
  respondDeficiency(
    @Param('id') deficiencyId: string,
    @CurrentUser() actor: any,
    @Body() dto: RespondDeficiencyDto,
  ) {
    return this.scrutinyService.respondDeficiency(deficiencyId, actor, dto);
  }

  @Post('deficiencies/:id/resolve')
  @Roles(RoleType.SCRUTINY_OFFICER)
  @ApiOperation({ summary: 'Scrutiny Officer marks deficiency as RESOLVED or REJECTED' })
  resolveDeficiency(
    @Param('id') deficiencyId: string,
    @CurrentUser() actor: any,
    @Body('resolution') resolution: 'RESOLVED' | 'REJECTED',
  ) {
    return this.scrutinyService.resolveDeficiency(deficiencyId, actor, resolution);
  }

  @Get('applications/:id/deficiencies')
  @ApiOperation({ summary: 'Get all deficiencies raised for an application' })
  getDeficiencies(@Param('id') applicationId: string) {
    return this.scrutinyService.getDeficiencies(applicationId);
  }
}
