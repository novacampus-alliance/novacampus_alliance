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

/**
 * DTO de mise à jour — tous les champs sont optionnels.
 * Seuls les champs envoyés dans le body seront modifiés.
 */
export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  program_name?: string;

  @IsOptional()
  @IsString()
  @IsIn(PROGRAM_TYPES)
  program_type?: (typeof PROGRAM_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  duration_years?: number;

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

  @IsOptional()
  @IsString()
  @IsIn(PROGRAM_STATUSES)
  status?: (typeof PROGRAM_STATUSES)[number];
}
