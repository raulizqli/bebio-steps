import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SymptomSeverity } from '../../../common/enums';

export class CreateSymptomDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ example: 'Fever' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Temperature rising since morning' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SymptomSeverity })
  @IsEnum(SymptomSeverity)
  severity: SymptomSeverity;

  @ApiProperty({ example: '2026-02-08T10:00:00Z' })
  @IsDateString()
  observedAt: string;

  @ApiPropertyOptional({ example: 38.5, description: 'Temperature in Celsius' })
  @IsOptional()
  @IsNumber()
  temperatureCelsius?: number;

  @ApiPropertyOptional({ example: 'Cold/Flu' })
  @IsOptional()
  @IsString()
  relatedIllness?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSymptomDto {
  @ApiPropertyOptional({ enum: SymptomSeverity })
  @IsOptional()
  @IsEnum(SymptomSeverity)
  severity?: SymptomSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperatureCelsius?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedIllness?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
