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
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  room_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  building?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @IsIn(ROOM_TYPES)
  room_type?: (typeof ROOM_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  equipment?: string;

  @IsString()
  @IsIn(ROOM_STATUSES)
  status: (typeof ROOM_STATUSES)[number];
}
