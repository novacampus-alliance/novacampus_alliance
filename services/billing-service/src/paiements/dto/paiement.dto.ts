import {
  IsString, IsNumber, IsEnum, IsOptional, IsDateString,
  IsBoolean, IsArray, ValidateNested, Min, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutPaiement, MethodePaiement } from '../paiement.schema';

export class CreateEcheanceDto {
  @ApiProperty({ description: "Numéro de l'échéance", example: 1, minimum: 1 })
  @IsNumber() @Min(1) numero: number;

  @ApiProperty({ description: 'Montant de l\'échéance (€)', example: 2833.33, minimum: 0 })
  @IsNumber() @Min(0) montant: number;

  @ApiProperty({ description: "Date d'échéance (ISO 8601)", example: '2024-01-15' })
  @IsDateString() dateEcheance: string;
}

export class CreatePaiementDto {
  @ApiProperty({ description: 'ID Prisma de l\'étudiant', example: 'STU001' })
  @IsString() studentId: string;

  @ApiProperty({ description: 'ID du programme', example: 'PROG001' })
  @IsString() programmeId: string;

  @ApiPropertyOptional({ description: "ID de l'inscription Prisma", example: 'ENR001' })
  @IsOptional() @IsString() inscriptionId?: string;

  @ApiProperty({ description: 'Montant total (€)', example: 8500, minimum: 0 })
  @IsNumber() @Min(0) montantTotal: number;

  @ApiProperty({ description: "Date d'émission de la facture (ISO 8601)", example: '2024-09-01' })
  @IsDateString() dateEmission: string;

  @ApiProperty({ description: "Date d'échéance principale (ISO 8601)", example: '2024-10-01' })
  @IsDateString() dateEcheance: string;

  @ApiPropertyOptional({ description: 'Description libre', example: 'Frais de scolarité 2024-2025' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ description: 'Année académique', example: '2024-2025' })
  @IsOptional() @IsString() anneeAcademique?: string;

  @ApiPropertyOptional({ description: 'Paiement en plusieurs échéances ?', example: true })
  @IsOptional() @IsBoolean() estEcheancier?: boolean;

  @ApiPropertyOptional({ type: [CreateEcheanceDto], description: 'Tableau des échéances (si estEcheancier=true)' })
  @IsOptional() @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true }) @Type(() => CreateEcheanceDto)
  echeances?: CreateEcheanceDto[];
}

export class UpdatePaiementDto {
  @ApiPropertyOptional({ enum: StatutPaiement, description: 'Nouveau statut', example: StatutPaiement.PAYE })
  @IsOptional() @IsEnum(StatutPaiement) statut?: StatutPaiement;

  @ApiPropertyOptional({ description: "Nouvelle date d'échéance (ISO 8601)", example: '2024-11-01' })
  @IsOptional() @IsDateString() dateEcheance?: string;

  @ApiPropertyOptional({ description: 'Montant total (€)', example: 8500 })
  @IsOptional() @IsNumber() @Min(0) montantTotal?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Correction frais scolarité' })
  @IsOptional() @IsString() description?: string;
}

export class ConfirmerPaiementDto {
  @ApiProperty({ description: 'Montant encaissé (€)', example: 2833.33, minimum: 0 })
  @IsNumber() @Min(0) montant: number;

  @ApiPropertyOptional({ enum: MethodePaiement, description: 'Méthode de paiement', example: MethodePaiement.VIREMENT })
  @IsOptional() @IsEnum(MethodePaiement) methode?: MethodePaiement;

  @ApiPropertyOptional({ description: 'Référence du virement / chèque', example: 'VIR-2024-001' })
  @IsOptional() @IsString() reference?: string;

  @ApiPropertyOptional({ description: "ID MongoDB de l'échéance ciblée", example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsOptional() @IsString() echeanceId?: string;

  @ApiPropertyOptional({ description: 'Note interne', example: 'Reçu le 15/01/2024' })
  @IsOptional() @IsString() note?: string;

  @ApiPropertyOptional({ description: 'Date effective du paiement (ISO 8601)', example: '2024-01-15' })
  @IsOptional() @IsDateString() datePaiement?: string;
}

export class FilterPaiementDto {
  @ApiPropertyOptional({ enum: StatutPaiement, description: 'Filtrer par statut', example: StatutPaiement.EN_RETARD })
  @IsOptional() @IsEnum(StatutPaiement) statut?: StatutPaiement;

  @ApiPropertyOptional({ description: 'Filtrer par studentId', example: 'STU001' })
  @IsOptional() @IsString() studentId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par programmeId', example: 'PROG001' })
  @IsOptional() @IsString() programmeId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par année académique', example: '2024-2025' })
  @IsOptional() @IsString() anneeAcademique?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)', example: '2024-01-01' })
  @IsOptional() @IsString() dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)', example: '2024-12-31' })
  @IsOptional() @IsString() dateFin?: string;

  @ApiPropertyOptional({ description: 'Page (pagination)', example: 1 })
  @IsOptional() @IsNumber() @Type(() => Number) page?: number = 1;

  @ApiPropertyOptional({ description: 'Résultats par page', example: 20 })
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number = 20;
}

export class InscriptionCreeeDto {
  studentId: string;
  programmeId: string;
  inscriptionId: string;
  fraisAnnuels: number;
  anneeAcademique: string;
  nombreEcheances?: number;
}
