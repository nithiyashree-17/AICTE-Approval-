import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransitionDto {
  @ApiProperty({ example: 'SCRUTINY', description: 'Target state according to workflow definitions' })
  @IsString()
  @IsNotEmpty()
  targetStage: string;

  @ApiPropertyOptional({ example: 'Intake validation complete. Moving case to technical scrutiny.' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Optional metadata or references for transition' })
  @IsOptional()
  metadata?: any;
}
