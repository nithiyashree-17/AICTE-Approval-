import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HearingType {
  SHC_HEARING = 'SHC_HEARING',
  SAC_APPEAL = 'SAC_APPEAL',
}

export enum CommitteeRecommendationOutcome {
  RECOMMENDED_APPROVAL = 'RECOMMENDED_APPROVAL',
  RECOMMENDED_REJECTION = 'RECOMMENDED_REJECTION',
  REFERRED_FOR_EVC = 'REFERRED_FOR_EVC',
  NEEDS_CLARIFICATION = 'NEEDS_CLARIFICATION',
}

export class LodgeAppealDto {
  @ApiProperty({ example: 'Grounds of appeal: Land survey re-verification certificate submitted meets Clause 1.10 norms.' })
  @IsString()
  @IsNotEmpty()
  groundsOfAppeal: string;

  @ApiPropertyOptional({ example: 'doc-version-uuid-for-supporting-appeal-document' })
  @IsString()
  @IsOptional()
  supportingDocumentId?: string;
}

export class ScheduleHearingDto {
  @ApiProperty({ example: 'app-uuid-to-hear' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ enum: HearingType, example: HearingType.SHC_HEARING })
  @IsEnum(HearingType)
  hearingType: HearingType;

  @ApiProperty({ example: '2026-11-20T11:00:00.000Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: 'AICTE HQ Committee Room 3 / Virtual Hearing Link' })
  @IsString()
  @IsNotEmpty()
  locationOrLink: string;
}

export class RecordRecommendationDto {
  @ApiProperty({ enum: CommitteeRecommendationOutcome, example: CommitteeRecommendationOutcome.RECOMMENDED_APPROVAL })
  @IsEnum(CommitteeRecommendationOutcome)
  outcome: CommitteeRecommendationOutcome;

  @ApiProperty({ example: 'Hearing conducted with institution representatives. Rectification of fire NOC and title deeds verified.' })
  @IsString()
  @IsNotEmpty()
  observations: string;
}
