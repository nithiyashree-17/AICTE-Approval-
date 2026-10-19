import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { TransitionDto } from './dto/transition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(RoleType.INSTITUTION)
  @ApiOperation({ summary: 'Draft a new application (Institution only)' })
  @ApiResponse({ status: 201, description: 'Application draft created successfully' })
  createDraft(@CurrentUser() user: any, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.createDraft(user.institutionId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications scoped by caller role and assigned region' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'region', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('region') region?: string,
  ) {
    return this.applicationsService.findAll(user, { status, region });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details by ID with complete relationships' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.findOne(id, user);
  }

  @Get(':id/available-actions')
  @ApiOperation({ summary: 'Get allowed next workflow transitions for the current user' })
  getAvailableActions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.getAvailableActions(id, user);
  }

  @Post(':id/transitions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute an authorized state transition with outbox logging' })
  transition(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: TransitionDto,
  ) {
    return this.applicationsService.transition(id, user, dto);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get complete chronological stage history for audit' })
  getTimeline(@Param('id') id: string) {
    return this.applicationsService.getTimeline(id);
  }
}
