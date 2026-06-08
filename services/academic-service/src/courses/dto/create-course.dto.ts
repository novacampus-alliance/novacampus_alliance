import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const COURSE_STATUSES = ['actif', 'inactif', 'archive'] as const;

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  program_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  instructor_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  room_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  course_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  course_code: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  credits: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hours_total?: number;

  @IsString()
  @IsIn(COURSE_STATUSES)
  status: (typeof COURSE_STATUSES)[number];
}
