import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class RoomAvailabilityQueryDto {
  @ApiProperty({ description: 'ID du campus', example: 'CAMP001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  campus_id: string;

  @ApiProperty({ description: 'Jour de la semaine (1=Lundi … 7=Dimanche)', example: 1, minimum: 1, maximum: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  day_of_week: number;

  @ApiProperty({ description: 'Heure de début (HH:MM ou HH:MM:SS)', example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  start_time: string;

  @ApiProperty({ description: 'Heure de fin (HH:MM ou HH:MM:SS)', example: '12:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  end_time: string;

  @ApiPropertyOptional({ description: 'Année académique', example: '2023-2024' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  academic_year?: string;
}
