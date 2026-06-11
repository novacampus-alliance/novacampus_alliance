import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { INSTRUCTOR_STATUSES } from './create-instructor.dto';

export class UpdateInstructorDto {
  @ApiPropertyOptional({ description: 'ID du campus', example: 'CAMP001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @ApiPropertyOptional({ description: 'Prénom', example: 'Jean' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ description: 'Nom de famille', example: 'Mercier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ description: 'Email professionnel', example: 'j.mercier@novacampus.fr' })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone', example: '33180111111' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Département', example: 'Business' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  department?: string;

  @ApiPropertyOptional({ description: 'Spécialisation', example: 'Commerce International' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  specialization?: string;

  @ApiPropertyOptional({ description: "Date d'embauche (ISO 8601)", example: '2018-09-01' })
  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @ApiPropertyOptional({ enum: INSTRUCTOR_STATUSES, description: 'Statut', example: 'actif' })
  @IsOptional()
  @IsString()
  @IsIn(INSTRUCTOR_STATUSES)
  status?: (typeof INSTRUCTOR_STATUSES)[number];
}
