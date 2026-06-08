import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ENROLLMENT_STATUSES } from './create-enrollment.dto';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  student_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  academic_year?: string;

  @IsOptional()
  @IsString()
  @IsIn(ENROLLMENT_STATUSES)
  status?: (typeof ENROLLMENT_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  enrollment_date?: string;
}
