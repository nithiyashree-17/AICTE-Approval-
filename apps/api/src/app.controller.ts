import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'AICTE FlowGuard API status and available modules' })
  @ApiResponse({ status: 200, description: 'Service metadata and routes' })
  getApiRoot() {
    return {
      status: 'ok',
      service: 'AICTE FlowGuard - Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
      modules: {
        auth: '/api/v1/auth',
        applications: '/api/v1/applications',
        workflow: '/api/v1/workflow',
        scrutiny: '/api/v1/applications/:id/deficiencies',
        evc: '/api/v1/evc',
        compliance: '/api/v1/compliance',
        notifications: '/api/v1/notifications',
        audit: '/api/v1/audit',
        reports: '/api/v1/reports',
        documents: '/api/v1/documents',
        committees: '/api/v1/committees',
      },
    };
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Service health check endpoint' })
  getHealth() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
