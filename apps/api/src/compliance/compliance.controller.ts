import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateObligationDto, SubmitComplianceEvidenceDto, VerifyComplianceDto } from './dto/compliance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Compliance & Document Obligations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('institutions/:id/obligations')
  @Roles(RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Register an institutional compliance obligation' })
  createObligation(
    @Param('id') institutionId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateObligationDto,
  ) {
    return this.complianceService.createObligation(institutionId, user, dto);
  }

  @Get('obligations')
  @ApiOperation({ summary: 'List compliance obligations scoped by role' })
  findAll(@CurrentUser() user: any) {
    return this.complianceService.findAll(user);
  }

  @Post('obligations/:id/submissions')
  @Roles(RoleType.INSTITUTION)
  @ApiOperation({ summary: 'Upload renewal/compliance evidence preserving history' })
  submitEvidence(
    @Param('id') obligationId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitComplianceEvidenceDto,
  ) {
    return this.complianceService.submitEvidence(obligationId, user, dto);
  }

  @Post('submissions/:id/verify')
  @Roles(RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER, RoleType.SCRUTINY_OFFICER)
  @ApiOperation({ summary: 'Authorized officer marks compliance evidence VERIFIED or REJECTED' })
  verifySubmission(
    @Param('id') submissionId: string,
    @CurrentUser() user: any,
    @Body() dto: VerifyComplianceDto,
  ) {
    return this.complianceService.verifySubmission(submissionId, user, dto);
  }
}
