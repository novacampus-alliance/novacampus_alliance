import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const INSTRUCTOR_STATUSES = ['actif', 'inactif', 'conge', 'archive'] as const;
export type InstructorStatus = (typeof INSTRUCTOR_STATUSES)[number];

export class CreateInstructorDto {
  @ApiProperty({ description: "ID du campus d'appartenance", example: 'CAMP001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @ApiProperty({ description: 'Prénom', example: 'Jean' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ description: 'Nom de famille', example: 'Mercier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @ApiPropertyOptional({ description: 'Email professionnel', example: 'j.mercier@novacampus.fr' })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone', example: '33180111111' })
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

  @ApiProperty({ enum: INSTRUCTOR_STATUSES, description: "Statut de l'enseignant", example: 'actif' })
  @IsString()
  @IsIn(INSTRUCTOR_STATUSES)
  status: InstructorStatus;
}
