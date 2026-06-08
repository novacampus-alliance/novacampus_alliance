import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service Notification — alertes in-app, emails, rappels.
 * Implémentation initiale : lecture des notifications en BDD.
 */
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Liste les notifications récentes (M5 — à filtrer par user_id) */
  async findAll() {
    const notifications = await this.prisma.notification.findMany({
      take: 50,
      orderBy: { sent_at: 'desc' },
      select: {
        notification_id: true,
        user_id: true,
        type: true,
        message: true,
        sent_at: true,
        read: true,
      },
    });

    return {
      service: 'notification-service',
      count: notifications.length,
      data: notifications,
    };
  }
}
