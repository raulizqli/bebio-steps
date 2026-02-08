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
import { SleepType } from '../../../common/enums';

export class CreateSleepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ enum: SleepType })
  @IsEnum(SleepType)
  type: SleepType;

  @ApiProperty({ example: '2026-02-08T21:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ example: '2026-02-09T06:30:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 5, description: 'Quality rating 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSleepDto {
  @ApiPropertyOptional({ enum: SleepType })
  @IsOptional()
  @IsEnum(SleepType)
  type?: SleepType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
