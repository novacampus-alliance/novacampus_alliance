import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const ENROLLMENT_STATUSES = [
  'inscrit',
  'valide',
  'abandonne',
  'echec',
] as const;

export class CreateEnrollmentDto {
  @ApiProperty({ description: "ID de l'étudiant", example: 'STU001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  student_id: string;

  @ApiProperty({ description: 'ID du cours', example: 'CRS001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  course_id: string;

  @ApiPropertyOptional({ description: 'Numéro du semestre', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester?: number;

  @ApiProperty({ description: 'Année académique', example: '2023-2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  academic_year: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES, description: "Statut de l'inscription", example: 'inscrit' })
  @IsOptional()
  @IsString()
  @IsIn(ENROLLMENT_STATUSES)
  status?: (typeof ENROLLMENT_STATUSES)[number];

  @ApiProperty({ description: "Date d'inscription (ISO 8601)", example: '2023-09-01' })
  @IsDateString()
  enrollment_date: string;
}
