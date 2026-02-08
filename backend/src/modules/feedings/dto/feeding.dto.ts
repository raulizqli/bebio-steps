import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedingType, BreastSide } from '../../../common/enums';

export class CreateFeedingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ enum: FeedingType })
  @IsEnum(FeedingType)
  type: FeedingType;

  @ApiProperty({ example: '2026-02-08T14:30:00Z' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ example: '2026-02-08T14:50:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 4.5, description: 'Amount in ounces' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOz?: number;

  @ApiPropertyOptional({ example: 133.0, description: 'Amount in milliliters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMl?: number;

  @ApiPropertyOptional({ enum: BreastSide })
  @IsOptional()
  @IsEnum(BreastSide)
  breastSide?: BreastSide;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Similac' })
  @IsOptional()
  @IsString()
  formulaBrand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFeedingDto {
  @ApiPropertyOptional({ enum: FeedingType })
  @IsOptional()
  @IsEnum(FeedingType)
  type?: FeedingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOz?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMl?: number;

  @ApiPropertyOptional({ enum: BreastSide })
  @IsOptional()
  @IsEnum(BreastSide)
  breastSide?: BreastSide;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
