import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadIntentDto, ConfirmUploadDto, VerifyDocumentDto } from './dto/document.dto';
import { RoleType, DocumentVerificationStatus } from '../common/enums';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private readonly allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  private readonly maxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

  async createUploadIntent(user: any, dto: UploadIntentDto) {
    if (!user.institutionId) {
      throw new BadRequestException('User must belong to an institution to upload documents');
    }

    if (!this.allowedMimeTypes.includes(dto.mimeType)) {
      throw new BadRequestException(`Unsupported MIME type '${dto.mimeType}'. Allowed: PDF, JPEG, PNG.`);
    }

    if (dto.fileSize > this.maxFileSizeBytes) {
      throw new BadRequestException(`File size exceeds 25MB maximum limit.`);
    }

    // Check if document already exists for institution
    let doc = await this.prisma.document.findFirst({
      where: {
        institutionId: user.institutionId,
        documentType: dto.documentType,
        applicationId: dto.applicationId || null,
      },
      include: { versions: true },
    });

    const nextVersion = doc ? doc.currentVersion + 1 : 1;
    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `institutions/${user.institutionId}/${dto.documentType}/v${nextVersion}_${sanitizedFileName}`;

    if (!doc) {
      doc = await this.prisma.document.create({
        data: {
          institutionId: user.institutionId,
          applicationId: dto.applicationId,
          documentType: dto.documentType,
          currentVersion: 1,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          validityStatus: 'VALID',
        },
        include: { versions: true },
      });
    }

    // Pre-signed S3 upload URL (or local MinIO upload endpoint)
    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const uploadUrl = `${s3Endpoint}/${process.env.S3_BUCKET_NAME || 'aicte-documents'}/${objectKey}?token=${randomUUID()}`;

    return {
      documentId: doc.id,
      versionNumber: nextVersion,
      objectKey,
      uploadUrl,
      expiresInSeconds: 900,
    };
  }

  async confirmUpload(documentId: string, versionNumber: number, user: any, dto: ConfirmUploadDto, meta: { fileName: string; mimeType: string; fileSize: number }) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    if (doc.institutionId !== user.institutionId) {
      throw new ForbiddenException('Unauthorized document access');
    }

    const sanitizedFileName = meta.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `institutions/${user.institutionId}/${doc.documentType}/v${versionNumber}_${sanitizedFileName}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create version record
      const version = await tx.documentVersion.create({
        data: {
          documentId,
          versionNumber,
          s3ObjectKey: objectKey,
          fileName: meta.fileName,
          mimeType: meta.mimeType,
          fileSize: meta.fileSize,
          sha256Checksum: dto.sha256Checksum,
          verificationStatus: 'PENDING',
        },
      });

      // 2. Update parent current version
      await tx.document.update({
        where: { id: documentId },
        data: {
          currentVersion: versionNumber,
          updatedAt: new Date(),
        },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'DOCUMENT_VERSION_UPLOADED',
          resourceType: 'DOCUMENT_VERSION',
          resourceId: version.id,
          changesAfter: {
            documentId,
            versionNumber,
            sha256Checksum: dto.sha256Checksum,
          },
        },
      });

      return version;
    });
  }

  async getDownloadUrl(versionId: string, user: any) {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { document: true },
    });

    if (!version) {
      throw new NotFoundException(`Document version ${versionId} not found`);
    }

    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);

    // SEC-01 check: Institution cannot access another institution's documents
    if (userRoles.includes(RoleType.INSTITUTION) && version.document.institutionId !== user.institutionId) {
      throw new ForbiddenException('Access denied: Unauthorized access to external document (SEC-01)');
    }

    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const downloadUrl = `${s3Endpoint}/${process.env.S3_BUCKET_NAME || 'aicte-documents'}/${version.s3ObjectKey}?expires=${Date.now() + 900000}`;

    return {
      versionId: version.id,
      fileName: version.fileName,
      mimeType: version.mimeType,
      sha256Checksum: version.sha256Checksum,
      downloadUrl,
      expiresInSeconds: 900,
    };
  }

  async getDocumentsForApplication(applicationId: string) {
    return this.prisma.document.findMany({
      where: { applicationId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  async getDocumentsForInstitution(institutionId: string, user: any) {
    const userRoles: RoleType[] = user.roles.map((r: any) => r.role?.name || r.name);
    if (userRoles.includes(RoleType.INSTITUTION) && user.institutionId !== institutionId) {
      throw new ForbiddenException("Unauthorized: Cannot access another institution's documents (SEC-01)");
    }

    return this.prisma.document.findMany({
      where: { institutionId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  async verifyVersion(versionId: string, officer: any, dto: VerifyDocumentDto) {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException(`Document version ${versionId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.documentVersion.update({
        where: { id: versionId },
        data: {
          verificationStatus: dto.status,
          verifiedById: officer.id,
          verifiedAt: new Date(),
          rejectionReason: dto.reason,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: officer.id,
          action: 'DOCUMENT_VERSION_VERIFIED',
          resourceType: 'DOCUMENT_VERSION',
          resourceId: versionId,
          changesAfter: { status: dto.status, reason: dto.reason },
        },
      });

      return updated;
    });
  }
}
