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

/** Types de formation courants */
export const PROGRAM_TYPES = [
  'licence',
  'master',
  'bachelor',
  'bts',
  'mba',
  'doctorat',
  'autre',
] as const;

/** Statuts métier autorisés pour un programme */
export const PROGRAM_STATUSES = ['actif', 'inactif', 'archive'] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

/**
 * DTO de création d'un programme académique.
 * Validé automatiquement par le ValidationPipe global (class-validator).
 */
export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  program_name: string;

  @IsOptional()
  @IsString()
  @IsIn(PROGRAM_TYPES)
  program_type?: (typeof PROGRAM_TYPES)[number];

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  duration_years: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annual_tuition?: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  coordinator?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_students?: number;

  @IsString()
  @IsIn(PROGRAM_STATUSES)
  status: ProgramStatus;
}
