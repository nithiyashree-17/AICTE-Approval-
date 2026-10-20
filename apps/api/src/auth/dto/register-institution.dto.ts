import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
  Equals,
  IsIn,
} from 'class-validator';

export class RegisterInstitutionDto {
  @ApiProperty({ example: 'National Institute of Engineering & Technology' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  institutionName: string;

  @ApiProperty({ example: 'ENGINEERING', enum: ['ENGINEERING', 'MANAGEMENT', 'PHARMACY', 'ARCHITECTURE', 'POLYTECHNIC', 'HOTEL_MANAGEMENT', 'MCA'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ENGINEERING', 'MANAGEMENT', 'PHARMACY', 'ARCHITECTURE', 'POLYTECHNIC', 'HOTEL_MANAGEMENT', 'MCA', 'OTHER'])
  institutionType: string;

  @ApiProperty({ example: 'NORTH', enum: ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTH_WEST', 'SOUTH_WEST'] })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ example: 'Uttar Pradesh' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Sector 62, Institutional Area, Noida 201309' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'registrar@niet-demo.ac.in' })
  @IsEmail({}, { message: 'Official email must be a valid email address' })
  @IsNotEmpty()
  officialEmail: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Dr. Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  contactPersonName: string;

  @ApiProperty({ example: 'Registrar & Head of Statutory Approvals' })
  @IsString()
  @IsNotEmpty()
  contactPersonDesignation: string;

  @ApiProperty({ example: 'AicteP@ssw0rd2026!' })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'AicteP@ssw0rd2026!' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: 'Consent to statutory regulations and terms is required' })
  consent: boolean;
}
