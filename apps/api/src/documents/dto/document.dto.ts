import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentVerificationStatus, DocumentValidityStatus } from '../../common/enums';

export class UploadIntentDto {
  @ApiProperty({ example: 'LAND_LEASE', description: 'Type of document according to APH requirements' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'land_lease_deed_30yr.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 2048576, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiPropertyOptional({ example: 'app-uuid-if-linked-to-specific-application' })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ example: '2056-10-31T23:59:59.000Z' })
  @IsString()
  @IsOptional()
  expiryDate?: string;
}

export class ConfirmUploadDto {
  @ApiProperty({ example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' })
  @IsString()
  @IsNotEmpty()
  sha256Checksum: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ enum: DocumentVerificationStatus, example: DocumentVerificationStatus.VERIFIED })
  @IsEnum(DocumentVerificationStatus)
  status: DocumentVerificationStatus;

  @ApiPropertyOptional({ example: 'Original seal verified.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
