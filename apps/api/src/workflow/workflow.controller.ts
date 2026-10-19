import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowLoaderService } from './workflow-loader.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Workflow Templates & Stages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly loaderService: WorkflowLoaderService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List all 6 regulatory workflow templates with APH citations' })
  getAllTemplates() {
    return this.loaderService.getAllTemplates();
  }

  @Get('templates/:key')
  @ApiOperation({ summary: 'Get details of a specific workflow template' })
  getTemplate(@Param('key') key: string) {
    return this.loaderService.getTemplate(key);
  }

  @Get('stages')
  @ApiOperation({ summary: 'List all 12 regulatory stage definitions and valid transitions' })
  getAllStages() {
    return this.loaderService.getAllStages();
  }

  @Get('stages/:key')
  @ApiOperation({ summary: 'Get details of a specific stage definition' })
  getStage(@Param('key') key: string) {
    return this.loaderService.getStage(key);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List APH statutory rules and prototype policies with clause provenance' })
  getRules() {
    return this.loaderService.getRules();
  }
}
