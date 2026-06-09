import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SCHEDULE_STATUSES } from './create-schedule.dto';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  instructor_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  room_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  day_of_week?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  end_time?: string;

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
