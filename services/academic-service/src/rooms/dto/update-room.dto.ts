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
  @IsOptional()
  @IsString()
  @MaxLength(50)
  campus_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  room_name?: string;

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

  @IsOptional()
  @IsString()
  @IsIn(ROOM_STATUSES)
  status?: (typeof ROOM_STATUSES)[number];
}
