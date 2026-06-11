import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateEnrollmentNoteDto {
  @ApiProperty({ description: 'Note finale sur 20', example: 15.5, minimum: 0, maximum: 20 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(20)
  final_grade: number;
}
