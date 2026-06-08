import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaiementDocument = Paiement & Document;

export enum StatutPaiement {
  EN_ATTENTE = 'en_attente',
  PARTIEL = 'partiel',
  PAYE = 'paye',
  EN_RETARD = 'en_retard',
  ANNULE = 'annule',
}

export enum MethodePaiement {
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  ESPECES = 'especes',
  CARTE = 'carte',
}

@Schema({ _id: true })
export class Echeance {
  @Prop({ required: true }) numero: number;
  @Prop({ required: true }) montant: number;
  @Prop({ required: true }) dateEcheance: Date;
  @Prop({ default: 0 }) montantPaye: number;
  @Prop({ enum: StatutPaiement, default: StatutPaiement.EN_ATTENTE })
  statut: StatutPaiement;
  @Prop() datePaiement?: Date;
  @Prop({ enum: MethodePaiement }) methodePaiement?: MethodePaiement;
  @Prop() reference?: string;
}
export const EcheanceSchema = SchemaFactory.createForClass(Echeance);

@Schema({ _id: true })
export class Encaissement {
  @Prop({ required: true }) date: Date;
  @Prop({ required: true }) montant: number;
  @Prop({ enum: MethodePaiement }) methode?: MethodePaiement;
  @Prop() reference?: string;
  @Prop() echeanceId?: string;
  @Prop() note?: string;
}
export const EncaissementSchema = SchemaFactory.createForClass(Encaissement);

@Schema({ _id: true })
export class Relance {
  @Prop({ required: true }) date: Date;
  @Prop({ required: true }) type: string;
  @Prop() message?: string;
  @Prop({ default: false }) envoyee: boolean;
  @Prop() erreur?: string;
}
export const RelanceSchema = SchemaFactory.createForClass(Relance);

@Schema({ timestamps: true, collection: 'paiements' })
export class Paiement {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Student', index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Programme', index: true })
  programmeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Inscription' })
  inscriptionId?: Types.ObjectId;

  @Prop({ required: true, min: 0 }) montantTotal: number;
  @Prop({ default: 0, min: 0 }) montantPaye: number;
  @Prop({ default: 0, min: 0 }) soldeRestant: number;

  @Prop({ required: true }) dateEmission: Date;
  @Prop({ required: true, index: true }) dateEcheance: Date;
  @Prop() datePaiement?: Date;

  @Prop({ type: String, enum: StatutPaiement, default: StatutPaiement.EN_ATTENTE, index: true })
  statut: StatutPaiement;

  @Prop({ unique: true, sparse: true }) numeroFacture?: string;
  @Prop({ type: Object }) documentFacture?: Record<string, any>;

  @Prop({ type: [EcheanceSchema], default: [] }) echeances: Echeance[];
  @Prop({ type: [EncaissementSchema], default: [] }) encaissements: Encaissement[];
  @Prop({ type: [RelanceSchema], default: [] }) relances: Relance[];

  @Prop() description?: string;
  @Prop({ default: false }) estEcheancier: boolean;
  @Prop() anneeAcademique?: string;
}

export const PaiementSchema = SchemaFactory.createForClass(Paiement);
PaiementSchema.index({ statut: 1, dateEcheance: 1 });
PaiementSchema.index({ studentId: 1, statut: 1 });
