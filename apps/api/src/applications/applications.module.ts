import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { WorkflowModule } from '../workflow/workflow.module';

import { CaseBriefService } from './case-brief.service';

@Module({
  imports: [WorkflowModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, CaseBriefService],
  exports: [ApplicationsService, CaseBriefService],
})
export class ApplicationsModule {}
