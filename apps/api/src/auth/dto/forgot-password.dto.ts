import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'registrar@niet-demo.ac.in' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;
}
