import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Permission } from '../../../common/enums';

export class CreateInviteDto {
  @ApiProperty({ description: 'Baby ID to share access to' })
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ enum: UserRole, example: UserRole.NANNY })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    enum: Permission,
    isArray: true,
    example: [Permission.VIEW_FEEDINGS, Permission.LOG_FEEDINGS, Permission.VIEW_SLEEP],
  })
  @IsOptional()
  @IsArray()
  permissions?: Permission[];

  @ApiPropertyOptional({
    description: 'Access expiration date (useful for nannies)',
    example: '2026-03-15T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  accessExpiresAt?: string;

  @ApiPropertyOptional({
    description: 'Hours until the invite code expires (default: 48h)',
    example: 48,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  codeExpiresInHours?: number;
}

export class AcceptInviteDto {
  @ApiProperty({ description: 'The invite code shared by the parent', example: 'ABC123XYZ' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class UpdatePermissionsDto {
  @ApiProperty({
    enum: Permission,
    isArray: true,
    example: [Permission.VIEW_FEEDINGS, Permission.VIEW_SLEEP],
  })
  @IsArray()
  permissions: Permission[];

  @ApiPropertyOptional({
    description: 'New expiration date for access',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
