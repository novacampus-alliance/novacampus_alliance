import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Statuts métier autorisés pour un enseignant */
export const INSTRUCTOR_STATUSES = ['actif', 'inactif', 'conge', 'archive'] as const;
export type InstructorStatus = (typeof INSTRUCTOR_STATUSES)[number];

/**
 * DTO de création d'un enseignant.
 * Validé automatiquement par le ValidationPipe global (class-validator).
 */
export class CreateInstructorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

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

  @IsString()
  @IsIn(INSTRUCTOR_STATUSES)
  status: InstructorStatus;
}
