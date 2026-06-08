import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Paiement, PaiementDocument, StatutPaiement, Echeance } from './paiement.schema';
import { CreatePaiementDto, UpdatePaiementDto, ConfirmerPaiementDto, FilterPaiementDto, InscriptionCreeeDto } from './dto/paiement.dto';
import { FactureService } from './facture.service';

@Injectable()
export class PaiementsService {
  private readonly logger = new Logger(PaiementsService.name);

  constructor(
    @InjectModel(Paiement.name) private paiementModel: Model<PaiementDocument>,
    private eventEmitter: EventEmitter2,
    private factureService: FactureService,
  ) {}

  // ── ISSUE #20 : CRUD ──────────────────────────────────────────────────────

  async create(dto: CreatePaiementDto): Promise<PaiementDocument> {
    const numeroFacture = await this.genererNumeroFacture();
    let echeances: Partial<Echeance>[] = [];
    if (dto.estEcheancier && dto.echeances?.length) {
      const total = dto.echeances.reduce((s, e) => s + e.montant, 0);
      if (Math.abs(total - dto.montantTotal) > 0.01)
        throw new BadRequestException('La somme des echeances ne correspond pas au montant total');
      echeances = dto.echeances.map((e) => ({
        ...e, dateEcheance: new Date(e.dateEcheance), montantPaye: 0, statut: StatutPaiement.EN_ATTENTE,
      }));
    }
    const paiement = new this.paiementModel({
      studentId: new Types.ObjectId(dto.studentId),
      programmeId: new Types.ObjectId(dto.programmeId),
      inscriptionId: dto.inscriptionId ? new Types.ObjectId(dto.inscriptionId) : undefined,
      montantTotal: dto.montantTotal, montantPaye: 0, soldeRestant: dto.montantTotal,
      dateEmission: new Date(dto.dateEmission), dateEcheance: new Date(dto.dateEcheance),
      statut: StatutPaiement.EN_ATTENTE, numeroFacture,
      description: dto.description, anneeAcademique: dto.anneeAcademique,
      estEcheancier: dto.estEcheancier ?? false, echeances,
    });
    const saved = await paiement.save();
    saved.documentFacture = this.factureService.genererDocument(saved);
    await saved.save();
    this.logger.log(`Paiement cree : ${saved.numeroFacture}`);
    return saved;
  }

  async findAll(filters: FilterPaiementDto) {
    const query: Record<string, any> = {};
    if (filters.statut) query.statut = filters.statut;
    if (filters.studentId) query.studentId = new Types.ObjectId(filters.studentId);
    if (filters.programmeId) query.programmeId = new Types.ObjectId(filters.programmeId);
    if (filters.anneeAcademique) query.anneeAcademique = filters.anneeAcademique;
    if (filters.dateDebut || filters.dateFin) {
      query.dateEcheance = {};
      if (filters.dateDebut) query.dateEcheance.$gte = new Date(filters.dateDebut);
      if (filters.dateFin) query.dateEcheance.$lte = new Date(filters.dateFin);
    }
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const [items, total] = await Promise.all([
      this.paiementModel.find(query).sort({ dateEcheance: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.paiementModel.countDocuments(query),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string): Promise<PaiementDocument> {
    const p = await this.paiementModel.findById(id);
    if (!p) throw new NotFoundException(`Paiement ${id} introuvable`);
    return p;
  }

  async update(id: string, dto: UpdatePaiementDto): Promise<PaiementDocument> {
    const p = await this.findOne(id);
    Object.assign(p, { ...dto, ...(dto.dateEcheance && { dateEcheance: new Date(dto.dateEcheance) }) });
    return p.save();
  }

  async remove(id: string) {
    const r = await this.paiementModel.findByIdAndDelete(id);
    if (!r) throw new NotFoundException(`Paiement ${id} introuvable`);
    return { deleted: true };
  }

  async findEnRetard() {
    return this.paiementModel.find({ statut: StatutPaiement.EN_RETARD }).sort({ dateEcheance: 1 }).lean();
  }

  // ── ISSUE #22 : Confirmation & encaissements ──────────────────────────────

  async confirmerPaiement(id: string, dto: ConfirmerPaiementDto): Promise<PaiementDocument> {
    const p = await this.findOne(id);
    if (p.statut === StatutPaiement.PAYE) throw new BadRequestException('Paiement deja solde');
    if (p.statut === StatutPaiement.ANNULE) throw new BadRequestException('Paiement annule');
    const datePaiement = dto.datePaiement ? new Date(dto.datePaiement) : new Date();
    p.encaissements.push({ date: datePaiement, montant: dto.montant, methode: dto.methode, reference: dto.reference, echeanceId: dto.echeanceId, note: dto.note } as any);
    if (dto.echeanceId && p.estEcheancier) {
      const ech = p.echeances.find((e: any) => e._id.toString() === dto.echeanceId);
      if (!ech) throw new NotFoundException('Echeance introuvable');
      ech.montantPaye = (ech.montantPaye ?? 0) + dto.montant;
      ech.datePaiement = datePaiement;
      ech.statut = ech.montantPaye >= ech.montant ? StatutPaiement.PAYE : StatutPaiement.PARTIEL;
    }
    p.montantPaye = (p.montantPaye ?? 0) + dto.montant;
    p.soldeRestant = Math.max(0, p.montantTotal - p.montantPaye);
    if (p.soldeRestant === 0) { p.statut = StatutPaiement.PAYE; p.datePaiement = datePaiement; }
    else if (p.montantPaye > 0) p.statut = StatutPaiement.PARTIEL;
    const saved = await p.save();
    this.eventEmitter.emit('paiement.confirme', saved);
    return saved;
  }

  async getHistoriquePaiementsEtudiant(studentId: string) {
    const paiements = await this.paiementModel.find({ studentId: new Types.ObjectId(studentId) }).sort({ dateEmission: -1 }).lean();
    const totalPaye = paiements.reduce((s, p) => s + (p.montantPaye ?? 0), 0);
    const totalDu = paiements.reduce((s, p) => s + p.montantTotal, 0);
    return {
      paiements,
      resume: { totalPaye, totalDu, soldeRestant: totalDu - totalPaye, nbPaiements: paiements.length, nbEnRetard: paiements.filter((p) => p.statut === StatutPaiement.EN_RETARD).length },
    };
  }

  // ── ISSUE #21 : Hook inscription ──────────────────────────────────────────

  @OnEvent('inscription.creee')
  async handleInscriptionCreee(event: InscriptionCreeeDto) {
    this.logger.log(`[Hook] Generation facture etudiant ${event.studentId}`);
    const aujourd = new Date();
    const dateEcheance = new Date(aujourd);
    dateEcheance.setDate(dateEcheance.getDate() + 30);
    const nombreEcheances = event.nombreEcheances ?? 1;
    const estEcheancier = nombreEcheances > 1;
    const echeances = estEcheancier ? this.repartirEcheances(event.fraisAnnuels, nombreEcheances, aujourd) : [];
    return this.create({
      studentId: event.studentId, programmeId: event.programmeId, inscriptionId: event.inscriptionId,
      montantTotal: event.fraisAnnuels, dateEmission: aujourd.toISOString(),
      dateEcheance: estEcheancier ? echeances[echeances.length - 1].dateEcheance : dateEcheance.toISOString(),
      description: `Frais de scolarite — ${event.anneeAcademique}`,
      anneeAcademique: event.anneeAcademique, estEcheancier, echeances: estEcheancier ? echeances : undefined,
    });
  }

  // ── ISSUE #23 : Cron relances ─────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async verifierEcheancesDepassees() {
    this.logger.log('[CRON] Verification echeances depassees...');
    const now = new Date();
    const enAttente = await this.paiementModel.find({ statut: { $in: [StatutPaiement.EN_ATTENTE, StatutPaiement.PARTIEL] }, dateEcheance: { $lt: now } });
    for (const p of enAttente) {
      if (p.statut !== StatutPaiement.EN_RETARD) p.statut = StatutPaiement.EN_RETARD;
      const derniere = p.relances?.at(-1);
      if (!derniere || !this.memeJour(derniere.date, now)) {
        let envoyee = false;
        try { this.eventEmitter.emit('paiement.relance', { paiementId: p._id.toString(), studentId: p.studentId.toString(), montantDu: p.soldeRestant, dateEcheance: p.dateEcheance, numeroFacture: p.numeroFacture }); envoyee = true; } catch {}
        p.relances.push({ date: now, type: 'notification', message: `Relance automatique — solde : ${p.soldeRestant} EUR`, envoyee } as any);
      }
      await p.save();
    }
    const avecEcheancier = await this.paiementModel.find({ estEcheancier: true, statut: { $nin: [StatutPaiement.PAYE, StatutPaiement.ANNULE] } });
    for (const p of avecEcheancier) {
      let modifie = false;
      for (const e of p.echeances) { if (e.statut === StatutPaiement.EN_ATTENTE && new Date(e.dateEcheance) < now) { e.statut = StatutPaiement.EN_RETARD; modifie = true; } }
      if (modifie) { if (p.statut !== StatutPaiement.EN_RETARD) p.statut = StatutPaiement.EN_RETARD; await p.save(); }
    }
    this.logger.log('[CRON] Termine');
  }

  private repartirEcheances(montantTotal: number, nombre: number, debut: Date) {
    const base = Math.floor((montantTotal / nombre) * 100) / 100;
    const reste = Math.round((montantTotal - base * nombre) * 100) / 100;
    return Array.from({ length: nombre }, (_, i) => {
      const d = new Date(debut); d.setMonth(d.getMonth() + i + 1);
      return { numero: i + 1, montant: i === nombre - 1 ? base + reste : base, dateEcheance: d.toISOString() };
    });
  }

  private async genererNumeroFacture(): Promise<string> {
    const count = await this.paiementModel.countDocuments();
    return `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }

  private memeJour(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }
}
