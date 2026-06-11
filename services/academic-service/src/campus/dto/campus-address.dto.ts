import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CampusAddressDto {
  @ApiPropertyOptional({ description: 'Adresse postale', example: '45 Boulevard Éducation' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'Ville', example: 'Paris' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Code postal', example: '75006' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Région', example: 'Île-de-France' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  region?: string;
}
