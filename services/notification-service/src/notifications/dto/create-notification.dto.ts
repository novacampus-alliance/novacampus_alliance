import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export const NOTIFICATION_TYPES = ['SCHEDULE_CHANGE', 'PAYMENT_REMINDER', 'PAYMENT_OVERDUE', 'ENROLLMENT_REMINDER', 'INFO'] as const;

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: "ID de l'utilisateur destinataire", example: 'usr_abc123' })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({ description: "ID de l'étudiant destinataire", example: 'STU001' })
  @IsString()
  @IsOptional()
  student_id?: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES, description: 'Type de notification', example: 'PAYMENT_REMINDER' })
  @IsString()
  @IsNotEmpty()
  @IsIn(NOTIFICATION_TYPES)
  type: string;

  @ApiProperty({ description: 'Corps du message', example: 'Votre paiement du 15/01/2024 est en attente.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Détails supplémentaires (JSON encodé en texte)', example: '{"montant":2833.33}' })
  @IsString()
  @IsOptional()
  details?: string;
}
