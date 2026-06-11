import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'ID du programme', example: 'PROG001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  program_id: string;

  @ApiProperty({ description: "ID de l'enseignant responsable", example: 'INST001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  instructor_id: string;

  @ApiPropertyOptional({ description: 'ID de la salle assignée', example: 'ROOM101' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room_id?: string;

  @ApiProperty({ description: 'Intitulé du cours', example: 'Introduction au Commerce' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  course_name: string;

  @ApiProperty({ description: 'Code unique du cours', example: 'COM101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  course_code: string;

  @ApiProperty({ description: 'Numéro du semestre', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester: number;

  @ApiProperty({ description: 'Nombre de crédits ECTS', example: 6, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ description: "Volume horaire total (heures)", example: 45, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hours_total?: number;

  @ApiProperty({ enum: COURSE_STATUSES, description: 'Statut du cours', example: 'actif' })
  @IsString()
  @IsIn(COURSE_STATUSES)
  status: (typeof COURSE_STATUSES)[number];
}
