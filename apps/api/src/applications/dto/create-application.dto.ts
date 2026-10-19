import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationType } from '@prisma/client';

export class CreateApplicationDto {
  @ApiProperty({ enum: ApplicationType, example: ApplicationType.NEW_INSTITUTION_LOA })
  @IsEnum(ApplicationType)
  type: ApplicationType;

  @ApiProperty({ example: '2026-2027' })
  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @ApiProperty({ example: 'NORTH' })
  @IsString()
  @IsNotEmpty()
  assignedRegion: string;
}
