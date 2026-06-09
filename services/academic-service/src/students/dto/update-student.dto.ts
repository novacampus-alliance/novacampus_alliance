import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PAYMENT_STATUSES, STUDENT_STATUSES } from './create-student.dto';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  program_id?: string;

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
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(STUDENT_STATUSES)
  status?: (typeof STUDENT_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  enrollment_year?: number;

  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_STATUSES)
  payment_status?: (typeof PAYMENT_STATUSES)[number];

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
