import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const ENROLLMENT_STATUSES = [
  'inscrit',
  'valide',
  'abandonne',
  'echec',
] as const;

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  student_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  course_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  academic_year: string;

  @IsOptional()
  @IsString()
  @IsIn(ENROLLMENT_STATUSES)
  status?: (typeof ENROLLMENT_STATUSES)[number];

  @IsDateString()
  enrollment_date: string;
}
