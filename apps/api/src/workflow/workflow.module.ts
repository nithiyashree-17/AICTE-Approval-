import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowLoaderService } from './workflow-loader.service';
import { WorkflowController } from './workflow.controller';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowLoaderService],
  exports: [WorkflowService, WorkflowLoaderService],
})
export class WorkflowModule {}
