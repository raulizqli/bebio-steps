import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBabyDto {
  @ApiProperty({ example: 'Sofía' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'García' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 'female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 3.2 })
  @IsOptional()
  @IsNumber()
  birthWeightKg?: number;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  birthHeightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBabyDto {
  @ApiPropertyOptional({ example: 'Sofía' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'García' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetGoalsDto {
  @ApiPropertyOptional({ example: 14.0, description: 'Daily sleep hours goal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  dailySleepHoursGoal?: number;

  @ApiPropertyOptional({ example: 24.0, description: 'Daily feeding ounces goal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyFeedingOzGoal?: number;

  @ApiPropertyOptional({ example: 3, description: 'Daily meals goal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyMealsGoal?: number;

  @ApiPropertyOptional({ example: 3, description: 'Minimum naps per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minNapsPerDay?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifySleepGoal?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyFeedingGoal?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  notifyMealGoal?: boolean;

  @ApiPropertyOptional({ example: '20:00', description: 'Time to check goals daily (HH:mm)' })
  @IsOptional()
  @IsString()
  goalCheckTime?: string;
}
