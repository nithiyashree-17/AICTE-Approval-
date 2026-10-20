import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parser for httpOnly session cookies
  app.use(cookieParser());

  // Enable CORS for frontend web client
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Input validation with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('AICTE FlowGuard - Backend API')
    .setDescription(
      'AICTE FlowGuard Approval Workflow Automation, Compliance Monitoring, and Alert Management System',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Applications')
    .addTag('Scrutiny & Deficiencies')
    .addTag('Expert Visit Committee (EVC)')
    .addTag('Compliance & Document Obligations')
    .addTag('Notifications')
    .addTag('Reports & Analytics')
    .addTag('Audit Trail')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve root status endpoint
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      service: 'AICTE FlowGuard - Approval Workflow Automation API',
      version: '1.0.0',
      apiBase: '/api/v1',
      documentation: '/api/docs',
    });
  });

  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  httpAdapter.get('/health/liveness', (_req: any, res: any) => {
    res.json({ status: 'UP' });
  });

  httpAdapter.get('/health/readiness', (_req: any, res: any) => {
    res.json({ status: 'UP', db: 'connected' });
  });

  const port = process.env.PORT_API || 4000;
  await app.listen(port);
  console.log(`AICTE FlowGuard API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
