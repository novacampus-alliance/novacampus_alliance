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
  ValidateNested,
} from 'class-validator';
import { CampusAddressDto } from './campus-address.dto';

/** Statuts métier autorisés pour un campus */
export const CAMPUS_STATUSES = ['actif', 'inactif', 'en_construction'] as const;
export type CampusStatus = (typeof CAMPUS_STATUSES)[number];

/**
 * DTO de création d'un campus.
 * Validé automatiquement par le ValidationPipe global (class-validator).
 */
export class CreateCampusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  campus_name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CampusAddressDto)
  adresse?: CampusAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  campus_director?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(250)
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity_students?: number;

  @IsOptional()
  @IsDateString()
  opening_date?: string;

  @IsString()
  @IsIn(CAMPUS_STATUSES)
  status: CampusStatus;
}
