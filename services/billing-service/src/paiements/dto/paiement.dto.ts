import {
  IsString, IsNumber, IsEnum, IsOptional, IsDateString,
  IsBoolean, IsArray, ValidateNested, Min, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutPaiement, MethodePaiement } from '../paiement.schema';

export class CreateEcheanceDto {
  @IsNumber() @Min(1) numero: number;
  @IsNumber() @Min(0) montant: number;
  @IsDateString() dateEcheance: string;
}

export class CreatePaiementDto {
  @IsString() studentId: string;
  @IsString() programmeId: string;
  @IsOptional() @IsString() inscriptionId?: string;
  @IsNumber() @Min(0) montantTotal: number;
  @IsDateString() dateEmission: string;
  @IsDateString() dateEcheance: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() anneeAcademique?: string;
  @IsOptional() @IsBoolean() estEcheancier?: boolean;
  @IsOptional() @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true }) @Type(() => CreateEcheanceDto)
  echeances?: CreateEcheanceDto[];
}

export class UpdatePaiementDto {
  @IsOptional() @IsEnum(StatutPaiement) statut?: StatutPaiement;
  @IsOptional() @IsDateString() dateEcheance?: string;
  @IsOptional() @IsNumber() @Min(0) montantTotal?: number;
  @IsOptional() @IsString() description?: string;
}

export class ConfirmerPaiementDto {
  @IsNumber() @Min(0) montant: number;
  @IsOptional() @IsEnum(MethodePaiement) methode?: MethodePaiement;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() echeanceId?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsDateString() datePaiement?: string;
}

export class FilterPaiementDto {
  @IsOptional() @IsEnum(StatutPaiement) statut?: StatutPaiement;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() programmeId?: string;
  @IsOptional() @IsString() anneeAcademique?: string;
  @IsOptional() @IsString() dateDebut?: string;
  @IsOptional() @IsString() dateFin?: string;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number = 1;
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
