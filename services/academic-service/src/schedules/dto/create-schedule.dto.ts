import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const SCHEDULE_STATUSES = ['planifie', 'confirme', 'annule'] as const;

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  course_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  instructor_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  room_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  day_of_week: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  start_time: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  end_time: string;

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
  @IsIn(SCHEDULE_STATUSES)
  status?: (typeof SCHEDULE_STATUSES)[number];
}
