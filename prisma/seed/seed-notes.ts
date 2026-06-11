/**
 * Novacampus Alliance — Seed Notes & Relevés (script séparé)
 * Branche : dev
 *
 * Régénère UNIQUEMENT le volet notes à partir des étudiants
 * et cours déjà présents en base :
 *  - PostgreSQL : enrollments (purge puis recréation avec notes + assiduité)
 *  - MongoDB    : releves (un document par étudiant / année / semestre,
 *                 avec moyenne pondérée par crédits, mention, ECTS validés)
 *
 * Les autres données (campus, programmes, étudiants, cours, paiements,
 * plannings, users) ne sont PAS touchées.
 *
 * Usage :
 *   npx ts-node prisma/seed-notes.ts
 *
 * Prérequis :
 *   - La seed principale a déjà tourné (étudiants + cours en base)
 *   - .env avec DATABASE_URL et MONGO_URI
 */

import { PrismaClient } from '@prisma/client';
import { fakerFR as faker } from '@faker-js/faker';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── CONFIGURATION ───────────────────────────────────────────────────────────

const CONFIG = {
  SEED: 2024, // graine dédiée, reproductible

  ACADEMIC_YEARS: ['2023-2024', '2024-2025'],

  // Nombre de cours suivis par étudiant et par semestre
  COURSES_PER_SEMESTER: [3, 5],

  // Profils d'étudiants : chaque étudiant se voit attribuer UN profil
  // qui pilote ses notes et son assiduité sur tout son cursus.
  // → cohérence : un bon étudiant l'est partout, un décrocheur décroche.
  STUDENT_PROFILES: [
    { value: 'excellent',  weight: 15, notes: [14, 19.5], assiduite: [90, 100], tauxEchec: 0.00, tauxAbandon: 0.00 },
    { value: 'bon',        weight: 35, notes: [11, 16],   assiduite: [80, 98],  tauxEchec: 0.05, tauxAbandon: 0.02 },
    { value: 'moyen',      weight: 30, notes: [8, 13.5],  assiduite: [65, 90],  tauxEchec: 0.20, tauxAbandon: 0.05 },
    { value: 'fragile',    weight: 15, notes: [5, 11],    assiduite: [50, 80],  tauxEchec: 0.40, tauxAbandon: 0.10 },
    { value: 'decrocheur', weight: 5,  notes: [2, 9],     assiduite: [10, 55],  tauxEchec: 0.50, tauxAbandon: 0.35 },
  ],

  // L'année en cours : le semestre 2 est-il déjà noté ?
  // false = les inscriptions S2 2024-2025 restent en statut "inscrit" sans note
  CURRENT_S2_GRADED: false,
};

faker.seed(CONFIG.SEED);
const prisma = new PrismaClient();

// ─── Schéma Mongoose ─────────────────────────────────────────────────────────

const ReleveSchema = new mongoose.Schema({}, { strict: false });
const Releve = mongoose.model('Releve', ReleveSchema, 'releves');

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const int = (range: number[]) => faker.number.int({ min: range[0], max: range[1] });

function noteFloat(range: number[]): number {
  return faker.number.float({ min: range[0], max: range[1], fractionDigits: 1 });
}

function mention(moyenne: number): string {
  if (moyenne >= 16) return 'Très bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez bien';
  if (moyenne >= 10) return 'Passable';
  return 'Ajourné';
}

// ─── PURGE DU VOLET NOTES ────────────────────────────────────────────────────

async function purgeNotes() {
  console.log('🧹 Purge du volet notes...');

  const delEnrollments = await prisma.enrollment.deleteMany({});
  console.log(`  ✅ Postgres : ${delEnrollments.count} inscriptions supprimées`);

  const delReleves = await Releve.deleteMany({});
  console.log(`  ✅ Mongo : ${delReleves.deletedCount} relevés supprimés`);
}

// ─── GÉNÉRATION DES INSCRIPTIONS + NOTES (PostgreSQL) ────────────────────────

async function genererNotes() {
  console.log('\n📝 Génération des inscriptions et notes PostgreSQL...\n');

  const etudiants = await prisma.student.findMany({ include: { program: true } });
  if (etudiants.length === 0) {
    throw new Error('Aucun étudiant en base. Lance d\'abord la seed principale : npx prisma db seed');
  }

  // Cours regroupés par programme puis par semestre
  const cours = await prisma.course.findMany();
  const coursByProgram = new Map<string, { 1: any[]; 2: any[] }>();
  for (const c of cours) {
    if (!coursByProgram.has(c.program_id)) coursByProgram.set(c.program_id, { 1: [], 2: [] });
    coursByProgram.get(c.program_id)![c.semester as 1 | 2].push(c);
  }

  console.log(`  ${etudiants.length} étudiants, ${cours.length} cours trouvés`);

  let totalEnrollments = 0;
  const profileStats: Record<string, number> = {};
  // On garde le profil de chaque étudiant pour les stats du relevé Mongo
  const profileByStudent = new Map<string, (typeof CONFIG.STUDENT_PROFILES)[number]>();

  const currentYear = CONFIG.ACADEMIC_YEARS[CONFIG.ACADEMIC_YEARS.length - 1];

  for (const etudiant of etudiants) {
    // Profil tiré une fois par étudiant → cohérence sur tout le cursus
    const profile = faker.helpers.weightedArrayElement(
      CONFIG.STUDENT_PROFILES.map(p => ({ value: p, weight: p.weight })),
    );
    profileByStudent.set(etudiant.student_id, profile);
    profileStats[profile.value] = (profileStats[profile.value] ?? 0) + 1;

    const coursDuProgramme = coursByProgram.get(etudiant.program_id);
    if (!coursDuProgramme) continue;

    for (const year of CONFIG.ACADEMIC_YEARS) {
      // Pas d'inscriptions avant l'année d'arrivée de l'étudiant
      const anneeDebut = parseInt(year.split('-')[0]);
      if (etudiant.enrollment_year > anneeDebut) continue;

      for (const semester of [1, 2] as const) {
        const dispo = coursDuProgramme[semester];
        if (dispo.length === 0) continue;

        const n = Math.min(int(CONFIG.COURSES_PER_SEMESTER), dispo.length);
        const selection = faker.helpers.arrayElements(dispo, n);

        // Le S2 de l'année en cours peut ne pas encore être noté
        const isCurrentS2 = year === currentYear && semester === 2;
        const isGraded    = !isCurrentS2 || CONFIG.CURRENT_S2_GRADED;

        for (const course of selection) {
          let status: string;
          let finalGrade: number | undefined;
          let attendance: number;

          if (!isGraded) {
            // Semestre en cours : inscrit, pas de note, assiduité partielle
            status     = 'inscrit';
            finalGrade = undefined;
            attendance = noteFloat(profile.assiduite);
          } else {
            const r = faker.number.float({ min: 0, max: 1 });
            if (r < profile.tauxAbandon) {
              status     = 'abandonne';
              finalGrade = undefined;
              attendance = noteFloat([5, Math.max(15, profile.assiduite[0] - 20)]);
            } else if (r < profile.tauxAbandon + profile.tauxEchec) {
              status     = 'echec';
              finalGrade = noteFloat([Math.max(0, profile.notes[0] - 3), 9.5]);
              attendance = noteFloat([profile.assiduite[0], profile.assiduite[1]]);
            } else {
              status     = 'valide';
              finalGrade = noteFloat([Math.max(10, profile.notes[0]), profile.notes[1]]);
              attendance = noteFloat(profile.assiduite);
            }
          }

          await prisma.enrollment.create({
            data: {
              student_id:      etudiant.student_id,
              course_id:       course.course_id,
              semester,
              academic_year:   year,
              status,
              final_grade:     finalGrade,
              attendance_rate: Math.min(100, attendance),
              enrollment_date: new Date(`${year.split('-')[0]}-09-15`),
            },
          });
          totalEnrollments++;
        }
      }
    }
  }

  console.log(`  ✅ Inscriptions créées : ${totalEnrollments}`);
  console.log('  📊 Profils :', Object.entries(profileStats).map(([k, v]) => `${k}=${v}`).join(' | '));

  return profileByStudent;
}

// ─── GÉNÉRATION DES RELEVÉS DE NOTES (MongoDB) ───────────────────────────────

async function genererReleves() {
  console.log('\n🍃 Génération des relevés de notes MongoDB...\n');

  // On relit tout depuis Postgres : le relevé est un document dérivé,
  // toujours cohérent avec la source de vérité relationnelle.
  const enrollments = await prisma.enrollment.findMany({
    include: {
      course:  true,
      student: { include: { program: true, campus: true } },
    },
  });

  // Regroupement : étudiant → année → semestre
  type Key = string;
  const groupes = new Map<Key, typeof enrollments>();
  for (const e of enrollments) {
    const key = `${e.student_id}|${e.academic_year}|${e.semester}`;
    if (!groupes.has(key)) groupes.set(key, []);
    groupes.get(key)!.push(e);
  }

  let releveNum = 1;
  const relevesDocs: any[] = [];

  for (const [key, lignes] of groupes) {
    const [, year, semester] = key.split('|');
    const s = lignes[0].student;

    // Lignes du relevé
    const lignesReleve = lignes.map((e) => ({
      code_cours:    e.course.course_code,
      nom_cours:     e.course.course_name,
      credits:       e.course.credits,
      note:          e.final_grade !== null ? Number(e.final_grade) : null,
      assiduite:     e.attendance_rate !== null ? Number(e.attendance_rate) : null,
      statut:        e.status,
      credits_valides: e.status === 'valide' ? e.course.credits : 0,
    }));

    // Moyenne pondérée par crédits (uniquement sur les cours notés)
    const notees = lignesReleve.filter(l => l.note !== null);
    const totalCredits  = notees.reduce((acc, l) => acc + l.credits, 0);
    const moyenne = totalCredits > 0
      ? notees.reduce((acc, l) => acc + l.note! * l.credits, 0) / totalCredits
      : null;

    const creditsValides  = lignesReleve.reduce((acc, l) => acc + l.credits_valides, 0);
    const creditsInscrits = lignesReleve.reduce((acc, l) => acc + l.credits, 0);
    const assiduites = lignesReleve.filter(l => l.assiduite !== null);
    const assiduiteMoyenne = assiduites.length > 0
      ? assiduites.reduce((acc, l) => acc + l.assiduite!, 0) / assiduites.length
      : null;

    const estFinalise = moyenne !== null;

    relevesDocs.push({
      numero_releve:    `REL-${year.split('-')[0]}-S${semester}-${String(releveNum++).padStart(5, '0')}`,
      student_id:       s.student_id,
      nom_etudiant:     `${s.first_name} ${s.last_name}`,
      email_etudiant:   s.email,
      programme:        s.program.program_name,
      type_programme:   s.program.program_type,
      campus:           s.campus.campus_name,
      annee_academique: year,
      semestre:         Number(semester),
      statut_releve:    estFinalise ? 'finalise' : 'provisoire',
      lignes:           lignesReleve,
      synthese: {
        moyenne_generale:  moyenne !== null ? Math.round(moyenne * 100) / 100 : null,
        mention:           moyenne !== null ? mention(moyenne) : null,
        credits_valides:   creditsValides,
        credits_inscrits:  creditsInscrits,
        assiduite_moyenne: assiduiteMoyenne !== null ? Math.round(assiduiteMoyenne * 10) / 10 : null,
        nb_cours:          lignesReleve.length,
        nb_valides:        lignesReleve.filter(l => l.statut === 'valide').length,
        nb_echecs:         lignesReleve.filter(l => l.statut === 'echec').length,
        nb_abandons:       lignesReleve.filter(l => l.statut === 'abandonne').length,
        semestre_valide:   estFinalise && moyenne! >= 10 && creditsValides >= creditsInscrits * 0.5,
      },
      metadata: {
        genere_le:  new Date(),
        genere_par: 'seed:notes',
        source:     'enrollments',
      },
    });
  }

  await Releve.insertMany(relevesDocs);

  const finalises   = relevesDocs.filter(r => r.statut_releve === 'finalise').length;
  const provisoires = relevesDocs.length - finalises;
  console.log(`  ✅ Relevés Mongo : ${relevesDocs.length} (${finalises} finalisés, ${provisoires} provisoires)`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Novacampus Alliance — Seed Notes & Relevés (branche dev)');
  console.log(`   Graine faker : ${CONFIG.SEED} (reproductible)\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI!);

    await purgeNotes();
    await genererNotes();
    await genererReleves();

    console.log('\n✅ Seed Notes & Relevés terminée avec succès !');
    console.log('   Les autres données (paiements, plannings, users…) n\'ont pas été modifiées.');
  } catch (err) {
    console.error('\n❌ Erreur seed notes :', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

main();