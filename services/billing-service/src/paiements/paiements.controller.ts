import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto, UpdatePaiementDto, ConfirmerPaiementDto, FilterPaiementDto } from './dto/paiement.dto';

@Controller('paiements')
export class PaiementsController {
  constructor(private readonly svc: PaiementsService) {}

  /** POST /paiements */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePaiementDto) { return this.svc.create(dto); }

  /** GET /paiements?statut=en_retard (issue #20) */
  @Get()
  findAll(@Query() filters: FilterPaiementDto) { return this.svc.findAll(filters); }

  /** GET /paiements/en-retard */
  @Get('en-retard')
  findEnRetard() { return this.svc.findEnRetard(); }

  /** GET /paiements/etudiant/:studentId/historique (issue #22) */
  @Get('etudiant/:studentId/historique')
  historique(@Param('studentId') id: string) { return this.svc.getHistoriquePaiementsEtudiant(id); }

  /** GET /paiements/:id */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  /** PATCH /paiements/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaiementDto) { return this.svc.update(id, dto); }

  /** DELETE /paiements/:id */
  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  /** POST /paiements/:id/confirmer (issue #22) */
  @Post(':id/confirmer')
  @HttpCode(HttpStatus.OK)
  confirmer(@Param('id') id: string, @Body() dto: ConfirmerPaiementDto) { return this.svc.confirmerPaiement(id, dto); }
}
