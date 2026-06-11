import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: 'ID du cours', example: 'CRS001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_id?: string;

  @ApiPropertyOptional({ description: "ID de l'enseignant", example: 'INST001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  instructor_id?: string;

  @ApiPropertyOptional({ description: 'ID de la salle', example: 'ROOM101' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room_id?: string;

  @ApiPropertyOptional({ description: 'Jour de la semaine (1-7)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  day_of_week?: number;

  @ApiPropertyOptional({ description: 'Heure de début (HH:MM)', example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  start_time?: string;

  @ApiPropertyOptional({ description: 'Heure de fin (HH:MM)', example: '12:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  end_time?: string;

  @ApiPropertyOptional({ description: 'Semestre', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester?: number;

  @ApiPropertyOptional({ description: 'Année académique', example: '2023-2024' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  academic_year?: string;

  @ApiPropertyOptional({ enum: SCHEDULE_STATUSES, description: 'Statut', example: 'confirme' })
  @IsOptional()
  @IsString()
  @IsIn(SCHEDULE_STATUSES)
  status?: (typeof SCHEDULE_STATUSES)[number];
}
