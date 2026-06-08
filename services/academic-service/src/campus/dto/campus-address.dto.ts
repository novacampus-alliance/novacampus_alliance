import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Sous-objet représentant l'adresse postale d'un campus.
 * Correspond aux champs address, city, postal_code et region du modèle Prisma.
 */
export class CampusAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  postal_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  region?: string;
}
