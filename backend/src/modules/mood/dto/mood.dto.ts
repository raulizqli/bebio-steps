import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoodType } from '../../../common/enums';

export class CreateMoodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ enum: MoodType })
  @IsEnum(MoodType)
  mood: MoodType;

  @ApiPropertyOptional({ example: 3, description: 'Intensity 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  intensityLevel?: number;

  @ApiProperty({ example: '2026-02-08T15:00:00Z' })
  @IsDateString()
  observedAt: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Hunger' })
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMoodDto {
  @ApiPropertyOptional({ enum: MoodType })
  @IsOptional()
  @IsEnum(MoodType)
  mood?: MoodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  intensityLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
