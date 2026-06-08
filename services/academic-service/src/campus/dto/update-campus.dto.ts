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

/**
 * DTO de mise à jour — tous les champs sont optionnels.
 * Seuls les champs envoyés dans le body seront modifiés.
 */
export class UpdateCampusDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  campus_name?: string;

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

  @IsOptional()
  @IsString()
  @IsIn(CAMPUS_STATUSES)
  status?: (typeof CAMPUS_STATUSES)[number];
}
