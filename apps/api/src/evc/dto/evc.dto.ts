import { IsEnum, IsNotEmpty, IsString, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EvcMode, AssignmentRole } from '@prisma/client';

export class CommitteeMemberAssignmentDto {
  @ApiProperty({ example: 'user-uuid-for-member' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: AssignmentRole, example: AssignmentRole.CHAIRMAN })
  @IsEnum(AssignmentRole)
  role: AssignmentRole;
}

export class ScheduleEvcDto {
  @ApiProperty({ example: '2026-11-15T10:00:00.000Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ enum: EvcMode, example: EvcMode.PHYSICAL })
  @IsEnum(EvcMode)
  mode: EvcMode;

  @ApiProperty({ example: 'Plot 4, Institutional Area, Sector 6, New Delhi' })
  @IsString()
  @IsNotEmpty()
  locationOrLink: string;

  @ApiProperty({ type: [CommitteeMemberAssignmentDto] })
  @IsArray()
  members: CommitteeMemberAssignmentDto[];
}

export class SubmitEvcReportDto {
  @ApiProperty({ example: 'documents/evc-reports/evc-report-1-demo.pdf' })
  @IsString()
  @IsNotEmpty()
  s3ObjectKey: string;

  @ApiProperty({ example: { infrastructureCompliant: true, laboratoryScore: 92, remarks: 'Verified lab capacity.' } })
  findings: any;
}
