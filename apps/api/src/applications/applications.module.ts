import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { CaseBriefService } from './case-brief.service';
import { ScopeService } from '../common/scope.service';

@Module({
  imports: [WorkflowModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, CaseBriefService, ScopeService],
  exports: [ApplicationsService, CaseBriefService],
})
export class ApplicationsModule {}
