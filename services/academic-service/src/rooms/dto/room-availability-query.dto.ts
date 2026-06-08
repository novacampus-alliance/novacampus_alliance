import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class RoomAvailabilityQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

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
  @IsString()
  @MaxLength(50)
  academic_year?: string;
}
