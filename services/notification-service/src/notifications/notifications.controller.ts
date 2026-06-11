import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /** Liste les notifications de l'utilisateur connecté */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.findByUser(user.sub);
  }

  /** Marque une notification comme lue */
  @Put(':id/lire')
  @UseGuards(JwtAuthGuard)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  /** Endpoint interne — appelé par les autres microservices (réseau Docker uniquement) */
  @Post('internal')
  @HttpCode(HttpStatus.CREATED)
  createInternal(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
