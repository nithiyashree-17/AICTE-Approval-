import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { DocumentsModule } from './documents/documents.module';
import { CommitteesModule } from './committees/committees.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

import { ScopeService } from './common/scope.service';

import { AppController } from './app.controller';

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
    DocumentsModule,
    CommitteesModule,
  ],
  controllers: [AppController],
  providers: [
    ScopeService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [ScopeService],
})
export class AppModule {}
