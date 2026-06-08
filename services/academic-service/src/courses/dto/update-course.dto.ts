import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { COURSE_STATUSES } from './create-course.dto';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  program_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  instructor_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  room_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  course_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  credits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hours_total?: number;

  @IsOptional()
  @IsString()
  @IsIn(COURSE_STATUSES)
  status?: (typeof COURSE_STATUSES)[number];
}
