import { Injectable } from '@nestjs/common';
import { PaiementDocument } from './paiement.schema';

@Injectable()
export class FactureService {
  genererDocument(paiement: PaiementDocument): Record<string, any> {
    return {
      metadata: {
        version: '1.0',
        genereeLe: new Date().toISOString(),
        numeroFacture: paiement.numeroFacture,
      },
      emetteur: {
        nom: 'Novacampus Alliance',
        adresse: "12 rue de l'Universite, 75005 Paris",
        siret: '000 000 000 00000',
        email: 'comptabilite@novacampus.fr',
      },
      destinataire: {
        studentId: paiement.studentId.toString(),
        programmeId: paiement.programmeId.toString(),
        inscriptionId: paiement.inscriptionId?.toString(),
      },
      facturation: {
        dateEmission: paiement.dateEmission,
        dateEcheance: paiement.dateEcheance,
        description: paiement.description ?? 'Frais de scolarite',
        anneeAcademique: paiement.anneeAcademique,
        montantHT: paiement.montantTotal,
        tva: 0,
        montantTTC: paiement.montantTotal,
      },
      echeancier: paiement.estEcheancier
        ? paiement.echeances.map((e) => ({
            numero: e.numero,
            montant: e.montant,
            dateEcheance: e.dateEcheance,
            statut: e.statut,
          }))
        : null,
      mentionsLegales: {
        penalitesRetard: '3 fois le taux legal',
        indemniteRecouvrement: '40 EUR forfaitaire',
        escompte: 'Aucun escompte pour paiement anticipe',
      },
    };
  }
}
