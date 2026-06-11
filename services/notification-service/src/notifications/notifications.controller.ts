import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mes notifications', description: 'Retourne toutes les notifications de l\'utilisateur connecté, triées par date décroissante.' })
  @ApiResponse({ status: 200, description: 'Liste des notifications.' })
  @ApiResponse({ status: 401, description: 'Token absent ou invalide.' })
  findAll(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.findByUser(user.sub);
  }

  @Put(':id/lire')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue.' })
  @ApiResponse({ status: 401, description: 'Token absent ou invalide.' })
  @ApiResponse({ status: 403, description: 'Notification appartenant à un autre utilisateur.' })
  @ApiResponse({ status: 404, description: 'Notification introuvable.' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Post('internal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une notification (interne)', description: 'Endpoint réservé aux microservices internes via le réseau Docker — pas de JWT requis.' })
  @ApiResponse({ status: 201, description: 'Notification créée.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  createInternal(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
