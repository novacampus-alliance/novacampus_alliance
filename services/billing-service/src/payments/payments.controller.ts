import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';

/**
 * Controller Facturation — endpoints REST /api/payments.
 * Accessible via le gateway : GET http://localhost:3001/api/payments
 */
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
