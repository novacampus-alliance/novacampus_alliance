import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto, UpdatePaiementDto, ConfirmerPaiementDto, FilterPaiementDto } from './dto/paiement.dto';
import { StatutPaiement } from './paiement.schema';

@ApiTags('Paiements')
@Controller('paiements')
export class PaiementsController {
  constructor(private readonly svc: PaiementsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un paiement / facture' })
  @ApiResponse({ status: 201, description: 'Paiement créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreatePaiementDto) { return this.svc.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister les paiements', description: 'Filtres disponibles : statut, studentId, programmeId, anneeAcademique, dateDebut, dateFin, page, limit.' })
  @ApiQuery({ name: 'statut', required: false, enum: StatutPaiement, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'studentId', required: false, example: 'STU001' })
  @ApiQuery({ name: 'programmeId', required: false, example: 'PROG001' })
  @ApiQuery({ name: 'anneeAcademique', required: false, example: '2024-2025' })
  @ApiQuery({ name: 'dateDebut', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'dateFin', required: false, example: '2024-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Liste paginée des paiements.' })
  findAll(@Query() filters: FilterPaiementDto) { return this.svc.findAll(filters); }

  @Get('en-retard')
  @ApiOperation({ summary: 'Paiements en retard', description: 'Retourne tous les paiements dont la date d\'échéance est dépassée.' })
  @ApiResponse({ status: 200, description: 'Liste des paiements en retard.' })
  findEnRetard() { return this.svc.findEnRetard(); }

  @Get('etudiant/:studentId/historique')
  @ApiOperation({ summary: "Historique des paiements d'un étudiant" })
  @ApiParam({ name: 'studentId', description: "ID Prisma de l'étudiant", example: 'STU001' })
  @ApiResponse({ status: 200, description: "Historique complet des paiements." })
  historique(@Param('studentId') id: string) { return this.svc.getHistoriquePaiementsEtudiant(id); }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un paiement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du paiement', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Détail du paiement.' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable.' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un paiement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du paiement', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Paiement mis à jour.' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdatePaiementDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un paiement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du paiement', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Paiement supprimé.' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable.' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  @Post(':id/confirmer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer un encaissement', description: 'Enregistre un versement partiel ou total sur un paiement. Met à jour automatiquement le statut.' })
  @ApiParam({ name: 'id', description: 'ID MongoDB du paiement', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Encaissement enregistré, statut recalculé.' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable.' })
  confirmer(@Param('id') id: string, @Body() dto: ConfirmerPaiementDto) { return this.svc.confirmerPaiement(id, dto); }
}
