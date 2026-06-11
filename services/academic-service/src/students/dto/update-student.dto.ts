import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PAYMENT_STATUSES, STUDENT_STATUSES } from './create-student.dto';

export class UpdateStudentDto {
  @ApiPropertyOptional({ description: 'ID du campus', example: 'CAMP001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @ApiPropertyOptional({ description: 'ID du programme', example: 'PROG001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  program_id?: string;

  @ApiPropertyOptional({ description: 'Prénom', example: 'Alexandre' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ description: 'Nom', example: 'Dubois' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ description: 'Email', example: 'a.dubois@etu.novacampus.fr' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ enum: STUDENT_STATUSES, description: 'Statut', example: 'actif' })
  @IsOptional()
  @IsString()
  @IsIn(STUDENT_STATUSES)
  status?: (typeof STUDENT_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Date de naissance', example: '2003-05-15' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiPropertyOptional({ description: "Année d'inscription", example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  enrollment_year?: number;

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES, description: 'Statut de paiement', example: 'a_jour' })
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_STATUSES)
  payment_status?: (typeof PAYMENT_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Adresse', example: '12 Rue Étudiante' })
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

  @ApiPropertyOptional({ description: "Contact d'urgence", example: 'Marie Dubois' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  emergency_contact?: string;

  @ApiPropertyOptional({ description: "Téléphone d'urgence", example: '33620111111' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergency_phone?: string;
}
