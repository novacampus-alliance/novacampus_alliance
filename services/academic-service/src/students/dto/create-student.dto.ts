import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const STUDENT_STATUSES = ['actif', 'inactif', 'suspendu', 'diplome'] as const;
export const PAYMENT_STATUSES = ['a_jour', 'en_retard', 'impaye'] as const;

export class CreateStudentDto {
  @ApiProperty({ description: "ID du campus d'inscription", example: 'CAMP001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @ApiProperty({ description: 'ID du programme suivi', example: 'PROG001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  program_id: string;

  @ApiProperty({ description: 'Prénom', example: 'Alexandre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ description: 'Nom de famille', example: 'Dubois' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @ApiProperty({ description: 'Email étudiant (unique)', example: 'a.dubois@etu.novacampus.fr' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional({ enum: STUDENT_STATUSES, description: "Statut de l'étudiant", example: 'actif' })
  @IsOptional()
  @IsString()
  @IsIn(STUDENT_STATUSES)
  status?: (typeof STUDENT_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Date de naissance (ISO 8601)', example: '2003-05-15' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiProperty({ description: "Année d'inscription", example: 2023, minimum: 2000 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  enrollment_year: number;

  @ApiProperty({ enum: PAYMENT_STATUSES, description: 'Statut de paiement', example: 'a_jour' })
  @IsString()
  @IsIn(PAYMENT_STATUSES)
  payment_status: (typeof PAYMENT_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Adresse postale', example: '12 Rue Étudiante' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'Ville', example: 'Paris' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  city?: string;

  @ApiPropertyOptional({ description: 'Code postal', example: '75015' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  postal_code?: string;

  @ApiPropertyOptional({ description: "Contact d'urgence (nom)", example: 'Marie Dubois' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  emergency_contact?: string;

  @ApiPropertyOptional({ description: "Téléphone du contact d'urgence", example: '33620111111' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergency_phone?: string;
}
