import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const STUDENT_STATUSES = ['actif', 'inactif', 'suspendu', 'diplome'] as const;
export const PAYMENT_STATUSES = ['a_jour', 'en_retard', 'impaye'] as const;

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  program_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(STUDENT_STATUSES)
  status?: (typeof STUDENT_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  enrollment_year: number;

  @IsString()
  @IsIn(PAYMENT_STATUSES)
  payment_status: (typeof PAYMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  postal_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  emergency_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergency_phone?: string;
}
