import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * Controller Notification — endpoints REST /api/notifications.
 * Accessible via le gateway : GET http://localhost:3001/api/notifications
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }
}
