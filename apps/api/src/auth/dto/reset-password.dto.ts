import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '8f7a9d3c-1b2e-4f5a-9c8d-7e6f5a4b3c2d' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewAicteP@ssw0rd2026!' })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({ example: 'NewAicteP@ssw0rd2026!' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
