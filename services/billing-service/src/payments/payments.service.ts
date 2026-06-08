import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service Facturation — gestion des paiements et factures.
 * Implémentation initiale : lecture des paiements existants en BDD.
 */
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /** Liste les paiements (M3 — à enrichir avec filtres et pagination) */
  async findAll() {
    const payments = await this.prisma.payment.findMany({
      take: 50,
      orderBy: { invoice_date: 'desc' },
      select: {
        payment_id: true,
        student_id: true,
        invoice_date: true,
        due_date: true,
        amount: true,
        status: true,
        academic_year: true,
        semester: true,
      },
    });

    return {
      service: 'billing-service',
      count: payments.length,
      data: payments,
    };
  }
}
