import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentVerificationStatus } from '../../common/enums';

export class CreateObligationDto {
  @ApiProperty({ example: 'Land Lease Deed 30-Year Periodic Verification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Institution must maintain an active, unencumbered 30-year lease.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Registered lease renewal certificate and revenue registry extract' })
  @IsString()
  @IsNotEmpty()
  evidenceRequired: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'RULE_APH_CH1_LAND_LEASE' })
  @IsString()
  @IsOptional()
  sourceRuleId?: string;
}

export class SubmitComplianceEvidenceDto {
  @ApiProperty({ example: 'documents/compliance/lease-renewal-2026.pdf' })
  @IsString()
  @IsNotEmpty()
  s3ObjectKey: string;
}

export class VerifyComplianceDto {
  @ApiProperty({ enum: DocumentVerificationStatus, example: DocumentVerificationStatus.VERIFIED })
  @IsEnum(DocumentVerificationStatus)
  status: DocumentVerificationStatus;

  @ApiPropertyOptional({ example: 'Lease registered through 2056 verified against revenue records.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
