import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service Facturation — gestion des paiements et factures.
 * Implémentation initiale : lecture des paiements existants en BDD.
 */
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /** Liste les paiements avec le nombre de relances envoyées par facture. */
  async findAll() {
    const payments = await this.prisma.payment.findMany({
      orderBy: { invoice_date: 'desc' },
      select: {
        payment_id: true,
        student_id: true,
        invoice_date: true,
        due_date: true,
        payment_date: true,
        amount: true,
        status: true,
        academic_year: true,
        semester: true,
        _count: { select: { relance_history: true } },
      },
    });

    return {
      service: 'billing-service',
      count: payments.length,
      data: payments.map(({ _count, ...p }) => ({
        ...p,
        relances_count: _count.relance_history,
      })),
    };
  }
}
