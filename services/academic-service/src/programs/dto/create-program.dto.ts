import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const PROGRAM_TYPES = [
  'licence',
  'master',
  'bachelor',
  'bts',
  'mba',
  'doctorat',
  'autre',
] as const;

export const PROGRAM_STATUSES = ['actif', 'inactif', 'archive'] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export class CreateProgramDto {
  @ApiProperty({ description: 'ID du campus', example: 'CAMP001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @ApiProperty({ description: 'Nom de la formation', example: 'Bachelor Commerce International' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  program_name: string;

  @ApiPropertyOptional({ enum: PROGRAM_TYPES, description: 'Type de formation', example: 'bachelor' })
  @IsOptional()
  @IsString()
  @IsIn(PROGRAM_TYPES)
  program_type?: (typeof PROGRAM_TYPES)[number];

  @ApiProperty({ description: 'Durée en années', example: 3, minimum: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  duration_years: number;

  @ApiPropertyOptional({ description: 'Frais de scolarité annuels (€)', example: 8500, minimum: 0 })
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

  @ApiPropertyOptional({ description: 'Coordinateur pédagogique', example: 'Prof. Jean Mercier' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  coordinator?: string;

  @ApiPropertyOptional({ description: "Nombre maximal d'étudiants", example: 120, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_students?: number;

  @ApiProperty({ enum: PROGRAM_STATUSES, description: 'Statut du programme', example: 'actif' })
  @IsString()
  @IsIn(PROGRAM_STATUSES)
  status: ProgramStatus;
}
