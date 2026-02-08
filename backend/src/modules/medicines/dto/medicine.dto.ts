import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  babyId: string;

  @ApiProperty({ example: 'Acetaminophen (Tylenol)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '2.5ml' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ example: 'ml' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'Every 6 hours' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiProperty({ example: '2026-02-08T10:00:00Z' })
  @IsDateString()
  administeredAt: string;

  @ApiPropertyOptional({ example: '2026-02-08' })
  @IsOptional()
  @IsDateString()
  prescribedDate?: string;

  @ApiPropertyOptional({ example: '2026-02-15' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Dr. García' })
  @IsOptional()
  @IsString()
  prescribedBy?: string;

  @ApiPropertyOptional({ example: 'Fever' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: '0 */6 * * *', description: 'Cron expression for recurring' })
  @IsOptional()
  @IsString()
  recurringSchedule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sideEffects?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
