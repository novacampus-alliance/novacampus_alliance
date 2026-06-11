import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Paiements')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les paiements PostgreSQL', description: 'Lecture directe de la table Payment Prisma (agrégation cross-service).' })
  @ApiResponse({ status: 200, description: 'Liste des paiements PostgreSQL.' })
  findAll() {
    return this.paymentsService.findAll();
  }
}
