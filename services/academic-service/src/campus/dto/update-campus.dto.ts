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
  ValidateNested,
} from 'class-validator';
import { CAMPUS_STATUSES } from './create-campus.dto';
import { CampusAddressDto } from './campus-address.dto';

export class UpdateCampusDto {
  @ApiPropertyOptional({ description: 'Nom du campus', example: 'Campus Paris Centre' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  campus_name?: string;

  @ApiPropertyOptional({ type: CampusAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampusAddressDto)
  adresse?: CampusAddressDto;

  @ApiPropertyOptional({ description: 'Directeur du campus', example: 'Dr. Philippe Mercier' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  campus_director?: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone', example: '33170111111' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Email du campus', example: 'contact@novacampus.fr' })
  @IsOptional()
  @IsEmail()
  @MaxLength(250)
  email?: string;

  @ApiPropertyOptional({ description: 'Capacité maximale en étudiants', example: 1200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity_students?: number;

  @ApiPropertyOptional({ description: "Date d'ouverture (ISO 8601)", example: '2018-09-01' })
  @IsOptional()
  @IsDateString()
  opening_date?: string;

  @ApiPropertyOptional({ enum: CAMPUS_STATUSES, description: 'Statut du campus', example: 'actif' })
  @IsOptional()
  @IsString()
  @IsIn(CAMPUS_STATUSES)
  status?: (typeof CAMPUS_STATUSES)[number];
}
