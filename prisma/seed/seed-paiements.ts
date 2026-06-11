/**
 * Novacampus Alliance — Seed Paiements (script séparé)
 * Branche : dev
 *
 * Régénère UNIQUEMENT le volet financier à partir des étudiants
 * déjà présents en base :
 *  - PostgreSQL : payments + relance_history (purge puis recréation)
 *  - MongoDB    : factures + relances (purge puis recréation)
 *
 * Les données académiques (campus, programmes, étudiants, cours,
 * inscriptions, plannings, users) ne sont PAS touchées.
 *
 * Usage :
 *   npx ts-node prisma/seed-paiements.ts
 *
 * Prérequis :
 *   - La seed principale a déjà tourné (il faut des étudiants en base)
 *   - .env avec DATABASE_URL et MONGO_URI
 */

import { PrismaClient } from '@prisma/client';
import { fakerFR as faker } from '@faker-js/faker';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── CONFIGURATION ───────────────────────────────────────────────────────────

const CONFIG = {
  SEED: 1337, // graine différente de la seed principale, mais reproductible

  ACADEMIC_YEARS: ['2023-2024', '2024-2025'],

  // Répartition des statuts pour l'année EN COURS (échéances passées).
  // Ajuste ces poids pour stresser plus ou moins l'agent de relance.
  PAYMENT_DISTRIBUTION: {
    paye:            0.60,
    en_attente:      0.15,
    en_retard:       0.20,
    escalade_humain: 0.05,
  },

  // Répartition pour les années PASSÉES (l'historique est surtout soldé)
  PAST_YEAR_DISTRIBUTION: {
    paye:            0.92,
    escalade_humain: 0.08,
  },

  // Proportion de paiements fractionnés en 2 échéances (visible côté Mongo)
  SPLIT_PAYMENT_RATE: 0.30,

  // Méthodes de paiement avec leur fréquence
  PAYMENT_METHODS: [
    { value: 'virement',    weight: 4 },
    { value: 'cb',          weight: 3 },
    { value: 'prelevement', weight: 2 },
    { value: 'cheque',      weight: 1 },
  ],
};

faker.seed(CONFIG.SEED);
const prisma = new PrismaClient();

// ─── Schémas Mongoose ────────────────────────────────────────────────────────

const FactureSchema = new mongoose.Schema({}, { strict: false });
const RelanceSchema = new mongoose.Schema({}, { strict: false });
const Facture = mongoose.model('Facture', FactureSchema, 'factures');
const Relance = mongoose.model('Relance', RelanceSchema, 'relances');

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pickWeighted<T extends string>(dist: Record<T, number>): T {
  const r = faker.number.float({ min: 0, max: 1 });
  let acc = 0;
  for (const [key, weight] of Object.entries(dist) as [T, number][]) {
    acc += weight;
    if (r <= acc) return key;
  }
  return Object.keys(dist)[0] as T;
}

function joursDeRetard(dueDate: Date): number {
  return Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / 86400000));
}

function niveauRelance(status: string, retard: number): number {
  if (status === 'escalade_humain') return 3;
  return retard <= 7 ? 1 : retard <= 30 ? 2 : 3;
}

// ─── PURGE DU VOLET FINANCIER ────────────────────────────────────────────────

async function purgeFinances() {
  console.log('🧹 Purge du volet financier...');

  // Postgres — ordre FK : relances avant paiements
  const delRelances  = await prisma.relanceHistory.deleteMany({});
  const delPaiements = await prisma.payment.deleteMany({});
  console.log(`  ✅ Postgres : ${delRelances.count} relances, ${delPaiements.count} paiements supprimés`);

  // Mongo
  const delFactures   = await Facture.deleteMany({});
  const delRelancesMg = await Relance.deleteMany({});
  console.log(`  ✅ Mongo : ${delFactures.deletedCount} factures, ${delRelancesMg.deletedCount} relances supprimées`);
}

// ─── GÉNÉRATION DES PAIEMENTS (PostgreSQL) ───────────────────────────────────

async function genererPaiements() {
  console.log('\n💳 Génération des paiements PostgreSQL...\n');

  const etudiants = await prisma.student.findMany({
    include: { program: true },
  });

  if (etudiants.length === 0) {
    throw new Error(
      'Aucun étudiant en base. Lance d\'abord la seed principale : npx prisma db seed',
    );
  }
  console.log(`  ${etudiants.length} étudiants trouvés`);

  let totalPayments = 0;
  let totalRelances = 0;
  const statsByStatus: Record<string, number> = {};

  for (const etudiant of etudiants) {
    const montantAnnuel = Number(etudiant.program.annual_tuition ?? 5000);

    // Statut "tendance" de l'étudiant pour l'année en cours :
    // on le tire une fois par étudiant pour que ses paiements soient cohérents
    // (un étudiant en difficulté l'est sur ses deux semestres, pas au hasard).
    const tendanceCourante = pickWeighted(CONFIG.PAYMENT_DISTRIBUTION);

    for (const year of CONFIG.ACADEMIC_YEARS) {
      // Un étudiant inscrit en 2024 n'a pas de paiements 2023-2024
      const anneeDebut = parseInt(year.split('-')[0]);
      if (etudiant.enrollment_year > anneeDebut) continue;

      for (const semester of [1, 2]) {
        const invoiceDate = semester === 1
          ? new Date(`${year.split('-')[0]}-09-01`)
          : new Date(`${year.split('-')[1]}-02-01`);
        const dueDate = addDays(invoiceDate, 30);
        const isPast  = dueDate < new Date();

        // Année passée → distribution historique ; année courante →
        // tendance de l'étudiant si l'échéance est passée, sinon en_attente
        const status = year !== CONFIG.ACADEMIC_YEARS[CONFIG.ACADEMIC_YEARS.length - 1]
          ? pickWeighted(CONFIG.PAST_YEAR_DISTRIBUTION)
          : (isPast ? tendanceCourante : 'en_attente');

        const isPaye = status === 'paye';
        statsByStatus[status] = (statsByStatus[status] ?? 0) + 1;

        const payment = await prisma.payment.create({
          data: {
            student_id:     etudiant.student_id,
            invoice_date:   invoiceDate,
            due_date:       dueDate,
            amount:         montantAnnuel / 2,
            status,
            payment_date:   isPaye
              ? addDays(invoiceDate, faker.number.int({ min: 3, max: 29 }))
              : null,
            payment_method: isPaye
              ? faker.helpers.weightedArrayElement(CONFIG.PAYMENT_METHODS)
              : null,
            academic_year:  year,
            semester,
            notes:          status === 'escalade_humain'
              ? 'Dossier transmis au gestionnaire — relances IA sans réponse'
              : null,
          },
        });
        totalPayments++;

        // ── Historique de relances (Postgres) ──
        if (status === 'en_retard' || status === 'escalade_humain') {
          const retard = joursDeRetard(dueDate);
          const niveauMax = niveauRelance(status, retard);

          // Une relance par niveau atteint, espacées de 7 jours
          for (let niveau = 1; niveau <= niveauMax; niveau++) {
            await prisma.relanceHistory.create({
              data: {
                payment_id:    payment.payment_id,
                sent_at:       addDays(dueDate, niveau * 7),
                level:         niveau,
                channel:       niveau === 1
                  ? 'email'
                  : faker.helpers.arrayElement(['email', 'sms']),
                draft_content:
                  `Relance niveau ${niveau} — ${etudiant.first_name} ${etudiant.last_name}, ` +
                  `paiement de ${(montantAnnuel / 2).toFixed(2)} € (${year} S${semester}) ` +
                  `en retard de ${retard} jours.`,
                status:        niveau === 3 && status === 'escalade_humain'
                  ? 'en_attente'
                  : 'envoye',
                escalated:     niveau === 3,
              },
            });
            totalRelances++;
          }
        }
      }
    }
  }

  console.log(`  ✅ Paiements créés : ${totalPayments}`);
  console.log(`  ✅ Relances (Postgres) : ${totalRelances}`);
  console.log('  📊 Répartition :', Object.entries(statsByStatus)
    .map(([k, v]) => `${k}=${v}`)
    .join(' | '));
}

// ─── GÉNÉRATION DES DOCUMENTS MONGO ──────────────────────────────────────────

async function genererDocumentsMongo() {
  console.log('\n🍃 Génération des documents MongoDB...\n');

  const paiements = await prisma.payment.findMany({
    include: { student: { include: { program: true, campus: true } } },
  });

  let factureNum = 1;
  const facturesDocs: any[] = [];
  const relancesDocs: any[] = [];

  for (const p of paiements) {
    const s = p.student;
    const montant   = Number(p.amount);
    const isSplit   = faker.number.float({ min: 0, max: 1 }) < CONFIG.SPLIT_PAYMENT_RATE;
    const isPaye    = p.status === 'paye';

    // ── Échéancier : 1 ou 2 échéances selon SPLIT_PAYMENT_RATE ──
    const echeances = isSplit
      ? [
          {
            numero:    1,
            montant:   montant * 0.5,
            date_due:  p.due_date,
            date_paie: isPaye ? p.payment_date : undefined,
            statut:    isPaye ? 'paye' : (p.due_date < new Date() ? 'en_retard' : 'en_attente'),
          },
          {
            numero:    2,
            montant:   montant * 0.5,
            date_due:  addDays(p.due_date, 60),
            date_paie: isPaye ? addDays(p.payment_date!, 55) : undefined,
            statut:    isPaye ? 'paye' : 'en_attente',
          },
        ]
      : [
          {
            numero:    1,
            montant,
            date_due:  p.due_date,
            date_paie: isPaye ? p.payment_date : undefined,
            statut:    isPaye ? 'paye' : (p.due_date < new Date() ? 'en_retard' : 'en_attente'),
          },
        ];

    // ── Encaissements : un par échéance payée ──
    const encaissements = isPaye
      ? echeances.map((e) => ({
          date:      e.date_paie,
          montant:   e.montant,
          methode:   p.payment_method ?? 'virement',
          reference: `REF-${faker.string.alphanumeric(8).toUpperCase()}`,
        }))
      : [];

    facturesDocs.push({
      numero_facture:   `FAC-${p.academic_year.split('-')[0]}-${String(factureNum++).padStart(5, '0')}`,
      student_id:       s.student_id,
      payment_id:       p.payment_id,
      nom_etudiant:     `${s.first_name} ${s.last_name}`,
      programme:        s.program.program_name,
      campus:           s.campus.campus_name,
      annee_academique: p.academic_year,
      semestre:         p.semester,
      montant,
      date_emission:    p.invoice_date,
      date_echeance:    p.due_date,
      statut:           p.status,
      echeances,
      encaissements,
      metadata: {
        genere_le:  new Date(),
        genere_par: 'seed:paiements',
        source:     'inscription.creee',
      },
    });

    // ── Relances Mongo (miroir enrichi pour le module facturation) ──
    if (p.status === 'en_retard' || p.status === 'escalade_humain') {
      const retard = joursDeRetard(p.due_date);
      const niveau = niveauRelance(p.status, retard);

      relancesDocs.push({
        payment_id:       p.payment_id,
        student_id:       s.student_id,
        nom_etudiant:     `${s.first_name} ${s.last_name}`,
        email_etudiant:   s.email,
        niveau,
        date_relance:     addDays(p.due_date, niveau * 7),
        contenu:
          `Bonjour ${s.first_name},\n\n` +
          `Votre paiement de ${montant.toFixed(2)} € (${p.academic_year}, semestre ${p.semester}) ` +
          `est en retard de ${retard} jours.\n` +
          `Merci de régulariser votre situation dans les plus brefs délais.\n\n` +
          `Cordialement,\nService Facturation — Novacampus Alliance`,
        statut:           niveau === 3 ? 'escalade' : 'envoyee',
        canal:            'email',
        genere_par_ia:    niveau >= 2,
        valide_par_admin: niveau === 1,
        montant_du:       montant,
        jours_retard:     retard,
      });
    }
  }

  await Facture.insertMany(facturesDocs);
  if (relancesDocs.length) await Relance.insertMany(relancesDocs);

  console.log(`  ✅ Factures Mongo : ${facturesDocs.length} (dont ~${Math.round(facturesDocs.length * CONFIG.SPLIT_PAYMENT_RATE)} en 2 échéances)`);
  console.log(`  ✅ Relances Mongo : ${relancesDocs.length}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Novacampus Alliance — Seed Paiements (branche dev)');
  console.log(`   Graine faker : ${CONFIG.SEED} (reproductible)\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI!);

    await purgeFinances();
    await genererPaiements();
    await genererDocumentsMongo();

    console.log('\n✅ Seed Paiements terminée avec succès !');
    console.log('   Les données académiques n\'ont pas été modifiées.');
  } catch (err) {
    console.error('\n❌ Erreur seed paiements :', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

main();