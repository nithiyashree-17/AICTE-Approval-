import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeficiencyDto {
  @ApiProperty({ example: 'Chapter I, Clause 1.7.2' })
  @IsString()
  @IsOptional()
  clauseReference?: string;

  @ApiProperty({ example: 'Land ownership title deed verification pending clear surveyor certificate.' })
  @IsString()
  @IsNotEmpty()
  observation: string;

  @ApiProperty({ example: 'Upload certified surveyor map and updated non-encumbrance certificate.' })
  @IsString()
  @IsNotEmpty()
  requiredCorrection: string;
}

export class RespondDeficiencyDto {
  @ApiProperty({ example: 'Updated non-encumbrance certificate uploaded with surveyor seal.' })
  @IsString()
  @IsNotEmpty()
  institutionResponse: string;
}
