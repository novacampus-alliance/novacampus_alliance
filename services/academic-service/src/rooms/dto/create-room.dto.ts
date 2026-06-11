import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const ROOM_STATUSES = ['disponible', 'occupee', 'maintenance', 'archive'] as const;
export const ROOM_TYPES = [
  'amphitheatre',
  'salle_cours',
  'laboratoire',
  'autre',
] as const;

export class CreateRoomDto {
  @ApiProperty({ description: 'ID du campus', example: 'CAMP001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @ApiProperty({ description: 'Nom de la salle', example: 'Amphi Commerce A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  room_name: string;

  @ApiPropertyOptional({ description: 'Bâtiment', example: 'Bâtiment A' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  building?: string;

  @ApiPropertyOptional({ description: 'Étage', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({ description: 'Capacité en places', example: 120, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: ROOM_TYPES, description: 'Type de salle', example: 'amphitheatre' })
  @IsOptional()
  @IsString()
  @IsIn(ROOM_TYPES)
  room_type?: (typeof ROOM_TYPES)[number];

  @ApiPropertyOptional({ description: 'Équipements disponibles', example: 'Projecteur, Micro, Tableau interactif' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  equipment?: string;

  @ApiProperty({ enum: ROOM_STATUSES, description: 'Statut de la salle', example: 'disponible' })
  @IsString()
  @IsIn(ROOM_STATUSES)
  status: (typeof ROOM_STATUSES)[number];
}
