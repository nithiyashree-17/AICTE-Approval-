import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: '8f7a9d3c-1b2e-4f5a-9c8d-7e6f5a4b3c2d' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'registrar@niet-demo.ac.in', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
