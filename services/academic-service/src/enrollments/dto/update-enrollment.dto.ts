import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: "ID de l'étudiant", example: 'STU001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  student_id?: string;

  @ApiPropertyOptional({ description: 'ID du cours', example: 'CRS001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_id?: string;

  @ApiPropertyOptional({ description: 'Numéro du semestre', example: 1 })
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

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES, description: 'Statut', example: 'inscrit' })
  @IsOptional()
  @IsString()
  @IsIn(ENROLLMENT_STATUSES)
  status?: (typeof ENROLLMENT_STATUSES)[number];

  @ApiPropertyOptional({ description: "Date d'inscription (ISO 8601)", example: '2023-09-01' })
  @IsOptional()
  @IsDateString()
  enrollment_date?: string;
}
