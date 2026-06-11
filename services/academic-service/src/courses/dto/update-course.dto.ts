import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: 'ID du programme', example: 'PROG001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  program_id?: string;

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

  @ApiPropertyOptional({ description: 'Intitulé du cours', example: 'Introduction au Commerce' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  course_name?: string;

  @ApiPropertyOptional({ description: 'Code du cours', example: 'COM101' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_code?: string;

  @ApiPropertyOptional({ description: 'Numéro du semestre', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester?: number;

  @ApiPropertyOptional({ description: 'Crédits ECTS', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  credits?: number;

  @ApiPropertyOptional({ description: 'Volume horaire total', example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hours_total?: number;

  @ApiPropertyOptional({ enum: COURSE_STATUSES, description: 'Statut', example: 'actif' })
  @IsOptional()
  @IsString()
  @IsIn(COURSE_STATUSES)
  status?: (typeof COURSE_STATUSES)[number];
}
