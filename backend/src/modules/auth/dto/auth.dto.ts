import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'María' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+52 555 123 4567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'María' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'García López' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+52 555 123 4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Firebase Cloud Messaging token for push notifications' })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class LinkAlexaDto {
  @ApiProperty({ description: 'Alexa user ID from account linking' })
  @IsString()
  @IsNotEmpty()
  alexaUserId: string;
}
