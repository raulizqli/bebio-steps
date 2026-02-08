import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '../../../common/enums';

export class CreateMealDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  type: MealType;

  @ApiProperty({ example: '2026-02-08T12:00:00Z' })
  @IsDateString()
  time: string;

  @ApiPropertyOptional({ example: ['avocado', 'banana', 'rice cereal'] })
  @IsOptional()
  @IsArray()
  foods?: string[];

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOz?: number;

  @ApiPropertyOptional({ example: 'puree' })
  @IsOptional()
  @IsString()
  texture?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAllergenTest?: boolean;

  @ApiPropertyOptional({ example: 'peanut' })
  @IsOptional()
  @IsString()
  allergenTested?: string;

  @ApiPropertyOptional({ example: 'none' })
  @IsOptional()
  @IsString()
  reaction?: string;

  @ApiPropertyOptional({ example: 4, description: 'How well baby liked it 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMealDto {
  @ApiPropertyOptional({ enum: MealType })
  @IsOptional()
  @IsEnum(MealType)
  type?: MealType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  foods?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOz?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  texture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
