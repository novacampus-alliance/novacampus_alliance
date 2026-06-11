import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ROOM_STATUSES, ROOM_TYPES } from './create-room.dto';

export class UpdateRoomDto {
  @ApiPropertyOptional({ description: 'ID du campus', example: 'CAMP001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @ApiPropertyOptional({ description: 'Nom de la salle', example: 'Amphi Commerce A' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  room_name?: string;

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

  @ApiPropertyOptional({ description: 'Capacité', example: 120 })
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

  @ApiPropertyOptional({ description: 'Équipements', example: 'Projecteur, Micro' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  equipment?: string;

  @ApiPropertyOptional({ enum: ROOM_STATUSES, description: 'Statut', example: 'disponible' })
  @IsOptional()
  @IsString()
  @IsIn(ROOM_STATUSES)
  status?: (typeof ROOM_STATUSES)[number];
}
