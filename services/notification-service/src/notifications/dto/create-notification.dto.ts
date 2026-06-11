import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export const NOTIFICATION_TYPES = ['SCHEDULE_CHANGE', 'PAYMENT_REMINDER', 'PAYMENT_OVERDUE', 'ENROLLMENT_REMINDER', 'INFO'] as const;

export class CreateNotificationDto {
  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  student_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(NOTIFICATION_TYPES)
  type: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  details?: string;
}
