import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
      'Integrated AICTE Approval Workflow Automation, Compliance Monitoring, and Alert Management System (Problem ID 26262)',
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

  const port = process.env.PORT_API || 4000;
  await app.listen(port);
  console.log(`AICTE FlowGuard API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
