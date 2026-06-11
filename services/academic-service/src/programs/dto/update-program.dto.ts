import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PROGRAM_STATUSES, PROGRAM_TYPES } from './create-program.dto';

export class UpdateProgramDto {
  @ApiPropertyOptional({ description: 'ID du campus', example: 'CAMP001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @ApiPropertyOptional({ description: 'Nom de la formation', example: 'Bachelor Commerce International' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  program_name?: string;

  @ApiPropertyOptional({ enum: PROGRAM_TYPES, description: 'Type de formation', example: 'bachelor' })
  @IsOptional()
  @IsString()
  @IsIn(PROGRAM_TYPES)
  program_type?: (typeof PROGRAM_TYPES)[number];

  @ApiPropertyOptional({ description: 'Durée en années', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  duration_years?: number;

  @ApiPropertyOptional({ description: 'Frais annuels (€)', example: 8500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annual_tuition?: number;

  @ApiPropertyOptional({ description: 'Département', example: 'Business' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  department?: string;

  @ApiPropertyOptional({ description: 'Coordinateur', example: 'Prof. Jean Mercier' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  coordinator?: string;

  @ApiPropertyOptional({ description: "Nombre max d'étudiants", example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_students?: number;

  @ApiPropertyOptional({ enum: PROGRAM_STATUSES, description: 'Statut', example: 'actif' })
  @IsOptional()
  @IsString()
  @IsIn(PROGRAM_STATUSES)
  status?: (typeof PROGRAM_STATUSES)[number];
}
