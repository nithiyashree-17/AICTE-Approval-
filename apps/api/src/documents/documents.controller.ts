import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { OcrService } from './ocr.service';
import { UploadIntentDto, ConfirmUploadDto, VerifyDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '../common/enums';

@ApiTags('Documents & Evidence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly ocrService: OcrService,
  ) {}

  @Post('upload-intent')
  @Roles(RoleType.INSTITUTION)
  @ApiOperation({ summary: 'Request pre-signed S3 upload intent and token' })
  createUploadIntent(
    @CurrentUser() user: any,
    @Body() dto: UploadIntentDto,
  ) {
    return this.documentsService.createUploadIntent(user, dto);
  }

  @Post(':id/confirm')
  @Roles(RoleType.INSTITUTION)
  @ApiOperation({ summary: 'Confirm completed upload and record SHA-256 checksum' })
  confirmUpload(
    @Param('id') documentId: string,
    @Query('version') versionNumber: string,
    @CurrentUser() user: any,
    @Body() dto: ConfirmUploadDto,
    @Query('fileName') fileName: string,
    @Query('mimeType') mimeType: string,
    @Query('fileSize') fileSize: string,
  ) {
    return this.documentsService.confirmUpload(
      documentId,
      Number(versionNumber) || 1,
      user,
      dto,
      {
        fileName: fileName || 'uploaded_document.pdf',
        mimeType: mimeType || 'application/pdf',
        fileSize: Number(fileSize) || 1024,
      },
    );
  }

  @Get('versions/:versionId/download')
  @ApiOperation({ summary: 'Get short-lived signed download URL (15 min expiry)' })
  getDownloadUrl(
    @Param('versionId') versionId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getDownloadUrl(versionId, user);
  }

  @Get('applications/:applicationId')
  @ApiOperation({ summary: 'Get all evidence documents registered for an application' })
  getDocumentsForApplication(@Param('applicationId') applicationId: string) {
    return this.documentsService.getDocumentsForApplication(applicationId);
  }

  @Get('institutions/:institutionId')
  @ApiOperation({ summary: 'Get all compliance vault documents registered for an institution' })
  getDocumentsForInstitution(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getDocumentsForInstitution(institutionId, user);
  }

  @Post('versions/:versionId/verify')
  @Roles(RoleType.SCRUTINY_OFFICER, RoleType.REGIONAL_OFFICER, RoleType.BUREAU_OFFICER)
  @ApiOperation({ summary: 'Authorized officer marks document version VERIFIED or REJECTED' })
  verifyVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() officer: any,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.documentsService.verifyVersion(versionId, officer, dto);
  }

  @Post(':id/pre-check')
  @ApiOperation({ summary: 'Run OCR pre-check to extract candidate dates & verify APH norms' })
  preCheckDocument(
    @Param('id') documentId: string,
    @Body('documentType') documentType: string,
    @Body('fileName') fileName: string,
    @Body('sampleText') sampleText?: string,
  ) {
    return this.ocrService.preCheckDocument({
      documentId,
      documentType: documentType || 'LAND_LEASE',
      fileName: fileName || 'document.pdf',
      sampleText,
    });
  }
}
