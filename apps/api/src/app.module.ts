import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ScrutinyModule } from './scrutiny/scrutiny.module';
import { EvcModule } from './evc/evc.module';
import { ComplianceModule } from './compliance/compliance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ApplicationsModule,
    WorkflowModule,
    ScrutinyModule,
    EvcModule,
    ComplianceModule,
    NotificationsModule,
    AuditModule,
    ReportsModule,
  ],
})
export class AppModule {}
