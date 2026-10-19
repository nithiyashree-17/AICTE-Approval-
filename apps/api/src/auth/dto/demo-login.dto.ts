import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '../../common/enums';

export class DemoLoginDto {
  @ApiProperty({
    enum: RoleType,
    example: RoleType.SCRUTINY_OFFICER,
    description: 'Select one of the 10 seeded demo accounts (dev mode only)',
  })
  @IsEnum(RoleType)
  role: RoleType;
}
