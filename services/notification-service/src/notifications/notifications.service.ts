import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

const EMAIL_SUBJECTS: Record<string, string> = {
  SCHEDULE_CHANGE:      'Modification de votre emploi du temps',
  PAYMENT_REMINDER:     'Rappel de paiement — échéance dans 3 jours',
  PAYMENT_OVERDUE:      'Paiement en retard',
  ENROLLMENT_REMINDER:  'Rappel — échéance dans 7 jours',
  INFO:                 'Information NovaCampus',
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  // ── GET /notifications ───────────────────────────────────────────────────────

  async findByUser(userId: string) {
    const data = await this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { sent_at: 'desc' },
      take: 50,
      select: {
        notification_id: true,
        type: true,
        message: true,
        sent_at: true,
        read: true,
      },
    });
    return { count: data.length, data };
  }

  // ── PUT /notifications/:id/lire ──────────────────────────────────────────────

  async markAsRead(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });
    if (!notif || notif.user_id !== userId) {
      throw new NotFoundException('Notification introuvable');
    }
    return this.prisma.notification.update({
      where: { notification_id: notificationId },
      data: { read: true },
      select: { notification_id: true, read: true },
    });
  }

  // ── POST /notifications/internal (inter-services) ────────────────────────────

  async create(dto: CreateNotificationDto) {
    let userId = dto.user_id;
    let userEmail: string | null = null;
    let userFirstName = 'Utilisateur';

    if (!userId && dto.student_id) {
      const user = await this.prisma.user.findFirst({
        where: { student_id: dto.student_id },
        select: { user_id: true, email: true, first_name: true },
      });
      if (!user) {
        this.logger.warn(`create: aucun user pour student_id=${dto.student_id}`);
        return null;
      }
      userId = user.user_id;
      userEmail = user.email;
      userFirstName = user.first_name;
    } else if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true, first_name: true },
      });
      userEmail = user?.email ?? null;
      userFirstName = user?.first_name ?? 'Utilisateur';
    }

    if (!userId) {
      this.logger.warn('create: user_id ou student_id obligatoire');
      return null;
    }

    const notif = await this.prisma.notification.create({
      data: { user_id: userId, type: dto.type, message: dto.message },
    });

    if (userEmail) {
      await this.email.send({
        to: userEmail,
        subject: EMAIL_SUBJECTS[dto.type] ?? 'Notification NovaCampus',
        context: {
          title:     EMAIL_SUBJECTS[dto.type] ?? 'Notification',
          firstName: userFirstName,
          message:   dto.message,
          details:   dto.details,
        },
      });
    }

    return notif;
  }

  // ── CRON J-3 : paiements dus dans 3 jours ───────────────────────────────────

  @Cron('0 8 * * *', { name: 'payment-reminder-3d' })
  async remindPaymentsDueIn3Days() {
    this.logger.log('[CRON J-3] Rappels paiements...');
    const { start, end } = this.dayWindow(3);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: { in: ['en_attente', 'pending'] },
        due_date: { gte: start, lte: end },
      },
      select: { payment_id: true, student_id: true, amount: true, due_date: true },
    });

    let sent = 0;
    for (const p of payments) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          user: { student_id: p.student_id },
          type: 'PAYMENT_REMINDER',
          sent_at: { gte: this.startOfToday() },
        },
      });
      if (alreadyNotified) continue;

      await this.create({
        student_id: p.student_id,
        type: 'PAYMENT_REMINDER',
        message: `Votre paiement de ${p.amount} EUR est dû dans 3 jours (${this.frDate(p.due_date)}).`,
        details: `Référence paiement : ${p.payment_id}`,
      });
      sent++;
    }
    this.logger.log(`[CRON J-3] ${sent} rappel(s) envoyé(s)`);
  }

  // ── CRON J-7 : paiements dus dans 7 jours ───────────────────────────────────

  @Cron('5 8 * * *', { name: 'enrollment-reminder-7d' })
  async remindPaymentsDueIn7Days() {
    this.logger.log('[CRON J-7] Rappels echéances...');
    const { start, end } = this.dayWindow(7);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: { in: ['en_attente', 'pending'] },
        due_date: { gte: start, lte: end },
      },
      select: { payment_id: true, student_id: true, amount: true, due_date: true, academic_year: true },
    });

    let sent = 0;
    for (const p of payments) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          user: { student_id: p.student_id },
          type: 'ENROLLMENT_REMINDER',
          sent_at: { gte: this.startOfToday() },
        },
      });
      if (alreadyNotified) continue;

      await this.create({
        student_id: p.student_id,
        type: 'ENROLLMENT_REMINDER',
        message: `Rappel : votre échéance de paiement de ${p.amount} EUR approche dans 7 jours (${this.frDate(p.due_date)}).`,
        details: `Année académique ${p.academic_year} — référence : ${p.payment_id}`,
      });
      sent++;
    }
    this.logger.log(`[CRON J-7] ${sent} rappel(s) envoyé(s)`);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private dayWindow(daysFromNow: number) {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const start = new Date(target); start.setHours(0, 0, 0, 0);
    const end   = new Date(target); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private startOfToday() {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }

  private frDate(d: Date) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
