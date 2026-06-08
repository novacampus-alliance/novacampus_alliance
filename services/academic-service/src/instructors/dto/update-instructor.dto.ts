import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { INSTRUCTOR_STATUSES } from './create-instructor.dto';

/**
 * DTO de mise à jour — tous les champs sont optionnels.
 * Seuls les champs envoyés dans le body seront modifiés.
 */
export class UpdateInstructorDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  specialization?: string;

  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @IsOptional()
  @IsString()
  @IsIn(INSTRUCTOR_STATUSES)
  status?: (typeof INSTRUCTOR_STATUSES)[number];
}
