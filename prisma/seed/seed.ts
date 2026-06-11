/**
 * Novacampus Alliance — Seed générative de développement
 * Branche : dev
 *
 * Génère un volume paramétrable de données réalistes (faker, locale fr)
 * de façon REPRODUCTIBLE (graine fixe).
 *
 * Usage :
 *   npx prisma db seed
 *
 * Prérequis :
 *   npm install @faker-js/faker mongoose dotenv
 *   .env avec DATABASE_URL et MONGO_URI
 */

import { PrismaClient, Role } from '@prisma/client';
import { fakerFR as faker } from '@faker-js/faker';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── CONFIGURATION DU VOLUME ─────────────────────────────────────────────────
// Ajuste ces constantes pour grossir ou réduire la base.

const CONFIG = {
  SEED:                   42,     // graine faker — données identiques à chaque run
  NB_CAMPUS:              4,
  PROGRAMS_PER_CAMPUS:    [3, 5], // min/max
  ROOMS_PER_CAMPUS:       [8, 15],
  INSTRUCTORS_PER_CAMPUS: [10, 18],
  COURSES_PER_PROGRAM:    [5, 9],
  STUDENTS_PER_PROGRAM:   [15, 35],
  ENROLLMENTS_PER_STUDENT:[3, 6],
  SCHEDULE_CONFLICT_RATE: 0.05,   // 5% de créneaux en conflit volontaire (module IA)
  ACADEMIC_YEARS:         ['2023-2024', '2024-2025'],
  PAYMENT_DISTRIBUTION: {         // répartition des statuts de paiement
    paye:       0.60,
    en_attente: 0.15,
    en_retard:  0.20,
    escalade_humain: 0.05,
  },
};

faker.seed(CONFIG.SEED);
const prisma = new PrismaClient();

// ─── Schémas Mongoose ────────────────────────────────────────────────────────

const FactureSchema = new mongoose.Schema({}, { strict: false });
const RelanceSchema = new mongoose.Schema({}, { strict: false });
const Facture = mongoose.model('Facture', FactureSchema, 'factures');
const Relance = mongoose.model('Relance', RelanceSchema, 'relances');

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const int = (range: number[]) => faker.number.int({ min: range[0], max: range[1] });

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

function timeAt(hour: number): Date {
  return new Date(`1970-01-01T${String(hour).padStart(2, '0')}:00:00Z`);
}

// ─── Référentiels métier ─────────────────────────────────────────────────────

const VILLES = [
  { city: 'Puteaux',    region: 'Île-de-France',          postal: '92800' },
  { city: 'Lyon',       region: 'Auvergne-Rhône-Alpes',   postal: '69002' },
  { city: 'Bordeaux',   region: 'Nouvelle-Aquitaine',     postal: '33000' },
  { city: 'Lille',      region: 'Hauts-de-France',        postal: '59000' },
  { city: 'Toulouse',   region: 'Occitanie',              postal: '31000' },
  { city: 'Nantes',     region: 'Pays de la Loire',       postal: '44000' },
];

const DEPARTEMENTS = [
  { dept: 'Sciences & Technologies', specialites: ['Développement Backend', 'Développement Frontend', 'Bases de données', 'Cybersécurité', 'Réseaux', 'Data Science'], prefix: 'INFO',
    cours: ['Développement Web Avancé', 'Bases de Données Relationnelles', 'Algorithmique', 'Architecture Logicielle', 'Sécurité des SI', 'DevOps & Cloud', 'Programmation Mobile', 'Intelligence Artificielle', 'Systèmes Distribués'] },
  { dept: 'Sciences de Gestion', specialites: ['Comptabilité & Audit', 'Finance de Marché', 'Contrôle de Gestion', 'Fiscalité'], prefix: 'FIN',
    cours: ['Comptabilité Analytique', 'Finance de Marché', 'Audit Financier', 'Contrôle de Gestion', 'Droit des Affaires', 'Fiscalité des Entreprises', 'Analyse Financière'] },
  { dept: 'Commerce & Marketing', specialites: ['Marketing Digital', 'Communication & Médias', 'E-commerce', 'Branding'], prefix: 'MKT',
    cours: ['SEO & Marketing de Contenu', 'Stratégie de Communication', 'Social Media Management', 'Études de Marché', 'Publicité Digitale', 'CRM & Relation Client', 'Growth Hacking'] },
  { dept: 'Ressources Humaines', specialites: ['Recrutement', 'Formation', 'Droit Social'], prefix: 'RH',
    cours: ['Gestion des Talents', 'Droit du Travail', 'Paie & Administration', 'SIRH', 'Management d\'Équipe'] },
];

const TYPES_PROGRAMME = [
  { type: 'Licence',  duree: 3, frais: [3800, 4800] },
  { type: 'Bachelor', duree: 3, frais: [5000, 6500] },
  { type: 'Master',   duree: 2, frais: [6000, 8500] },
  { type: 'MBA',      duree: 1, frais: [9000, 14000] },
];

// ─── SEED POSTGRESQL ─────────────────────────────────────────────────────────

async function seedPostgres() {
  console.log('\n📦 Seeding PostgreSQL...\n');

  // ── Campus ──
  const campuses = [];
  for (let i = 0; i < CONFIG.NB_CAMPUS; i++) {
    const v = VILLES[i % VILLES.length];
    const campus = await prisma.campus.create({
      data: {
        campus_name:       `Campus ${v.city}`,
        address:           faker.location.streetAddress(),
        city:              v.city,
        postal_code:       v.postal,
        region:            v.region,
        campus_director:   faker.person.fullName(),
        phone:             faker.phone.number(),
        email:             `${v.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@novacampus.fr`,
        capacity_students: faker.number.int({ min: 500, max: 1500 }),
        opening_date:      faker.date.between({ from: '2008-09-01', to: '2020-09-01' }),
        status:            'actif',
      },
    });
    campuses.push(campus);
  }
  console.log(`  ✅ Campus: ${campuses.length}`);

  // ── Programmes ──
  const programs = [];
  for (const campus of campuses) {
    const n = int(CONFIG.PROGRAMS_PER_CAMPUS);
    for (let i = 0; i < n; i++) {
      const deptInfo = faker.helpers.arrayElement(DEPARTEMENTS);
      const typeInfo = faker.helpers.arrayElement(TYPES_PROGRAMME);
      const program = await prisma.program.create({
        data: {
          campus_id:      campus.campus_id,
          program_name:   `${typeInfo.type} ${faker.helpers.arrayElement(deptInfo.specialites)}`,
          program_type:   typeInfo.type,
          duration_years: typeInfo.duree,
          annual_tuition: faker.number.int({ min: typeInfo.frais[0], max: typeInfo.frais[1] }),
          department:     deptInfo.dept,
          coordinator:    `Prof. ${faker.person.fullName()}`,
          max_students:   faker.number.int({ min: 60, max: 200 }),
          status:         'actif',
        },
      });
      programs.push({ ...program, _dept: deptInfo });
    }
  }
  console.log(`  ✅ Programmes: ${programs.length}`);

  // ── Salles ──
  const roomsByCampus = new Map<string, any[]>();
  let totalRooms = 0;
  for (const campus of campuses) {
    const n = int(CONFIG.ROOMS_PER_CAMPUS);
    const rooms = [];
    for (let i = 0; i < n; i++) {
      const type = faker.helpers.weightedArrayElement([
        { value: 'cours', weight: 5 },
        { value: 'labo',  weight: 3 },
        { value: 'amphi', weight: 2 },
      ]);
      const room = await prisma.room.create({
        data: {
          campus_id: campus.campus_id,
          room_name: type === 'amphi' ? `Amphi ${String.fromCharCode(65 + i)}` : `Salle ${100 + i}`,
          building:  faker.helpers.arrayElement(['Bâtiment Principal', 'Bâtiment Tech', 'Bâtiment Sud', 'Annexe Nord']),
          floor:     faker.number.int({ min: 0, max: 4 }),
          capacity:  type === 'amphi' ? faker.number.int({ min: 100, max: 250 }) : faker.number.int({ min: 20, max: 45 }),
          room_type: type,
          equipment: faker.helpers.arrayElements(['Vidéoprojecteur', 'Tableau blanc', 'Sono', 'PC', 'Visio'], { min: 1, max: 3 }).join(', '),
          status:    'disponible',
        },
      });
      rooms.push(room);
      totalRooms++;
    }
    roomsByCampus.set(campus.campus_id, rooms);
  }
  console.log(`  ✅ Salles: ${totalRooms}`);

  // ── Enseignants ──
  const instructorsByCampus = new Map<string, any[]>();
  let totalInstructors = 0;
  for (const campus of campuses) {
    const n = int(CONFIG.INSTRUCTORS_PER_CAMPUS);
    const instructors = [];
    for (let i = 0; i < n; i++) {
      const deptInfo = faker.helpers.arrayElement(DEPARTEMENTS);
      const firstName = faker.person.firstName();
      const lastName  = faker.person.lastName();
      const instructor = await prisma.instructor.create({
        data: {
          campus_id:      campus.campus_id,
          first_name:     firstName,
          last_name:      lastName,
          email:          faker.internet.email({ firstName, lastName, provider: 'novacampus.fr' }).toLowerCase(),
          phone:          faker.phone.number(),
          department:     deptInfo.dept,
          specialization: faker.helpers.arrayElement(deptInfo.specialites),
          hire_date:      faker.date.between({ from: '2010-01-01', to: '2024-06-01' }),
          status:         'actif',
        },
      });
      instructors.push({ ...instructor, _dept: deptInfo.dept });
      totalInstructors++;
    }
    instructorsByCampus.set(campus.campus_id, instructors);
  }
  console.log(`  ✅ Enseignants: ${totalInstructors}`);

  // ── Cours ──
  const coursesByProgram = new Map<string, any[]>();
  let totalCourses = 0;
  const usedCodes = new Set<string>();

  for (const program of programs) {
    const instructors = instructorsByCampus.get(program.campus_id)!;
    const rooms       = roomsByCampus.get(program.campus_id)!;
    const n = Math.min(int(CONFIG.COURSES_PER_PROGRAM), program._dept.cours.length);
    const coursNames = faker.helpers.arrayElements(program._dept.cours, n);
    const courses = [];

    for (const name of coursNames) {
      let code: string;
      do {
        code = `${program._dept.prefix}${faker.number.int({ min: 100, max: 699 })}`;
      } while (usedCodes.has(code));
      usedCodes.add(code);

      const course = await prisma.course.create({
        data: {
          program_id:    program.program_id,
          instructor_id: faker.helpers.arrayElement(instructors).instructor_id,
          room_id:       faker.helpers.arrayElement(rooms).room_id,
          course_name:   name,
          course_code:   code,
          semester:      faker.helpers.arrayElement([1, 2]),
          credits:       faker.number.int({ min: 3, max: 8 }),
          hours_total:   faker.helpers.arrayElement([30, 40, 45, 60]),
          status:        'actif',
        },
      });
      courses.push(course);
      totalCourses++;
    }
    coursesByProgram.set(program.program_id, courses);
  }
  console.log(`  ✅ Cours: ${totalCourses}`);

  // ── Plannings (avec conflits volontaires pour le module IA) ──
  let totalSchedules = 0;
  let totalConflicts = 0;
  const lastSlotByRoom = new Map<string, { day: number; start: number; end: number }>();

  for (const program of programs) {
    const courses     = coursesByProgram.get(program.program_id)!;
    const rooms       = roomsByCampus.get(program.campus_id)!;

    for (const course of courses) {
      const day   = faker.number.int({ min: 1, max: 5 });
      const start = faker.helpers.arrayElement([8, 9, 10, 14, 15, 16]);
      const end   = start + 3;
      let roomId  = faker.helpers.arrayElement(rooms).room_id;

      // Injection volontaire de conflits de salle (cas de test module IA)
      const makeConflict = faker.number.float({ min: 0, max: 1 }) < CONFIG.SCHEDULE_CONFLICT_RATE;
      let conflictDay = day, conflictStart = start;
      if (makeConflict && lastSlotByRoom.size > 0) {
        const [existingRoomId, slot] = faker.helpers.arrayElement([...lastSlotByRoom.entries()]);
        roomId        = existingRoomId;
        conflictDay   = slot.day;
        conflictStart = slot.start + 1; // chevauchement garanti
        totalConflicts++;
      }

      await prisma.schedule.create({
        data: {
          course_id:     course.course_id,
          instructor_id: course.instructor_id,
          room_id:       roomId,
          day_of_week:   makeConflict ? conflictDay : day,
          start_time:    timeAt(makeConflict ? conflictStart : start),
          end_time:      timeAt((makeConflict ? conflictStart : start) + 3),
          semester:      course.semester,
          academic_year: '2024-2025',
          status:        'actif',
        },
      });
      lastSlotByRoom.set(roomId, { day: makeConflict ? conflictDay : day, start: makeConflict ? conflictStart : start, end });
      totalSchedules++;
    }
  }
  console.log(`  ✅ Plannings: ${totalSchedules} (dont ~${totalConflicts} conflits volontaires pour le module IA)`);

  // ── Users admin/direction ──
  const hashedAdmin = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.create({
    data: { email: 'admin@novacampus.fr', password_hash: hashedAdmin, role: Role.ADMIN, first_name: 'Admin', last_name: 'Novacampus', campus_id: campuses[0].campus_id, is_active: true },
  });
  await prisma.user.create({
    data: { email: 'direction@novacampus.fr', password_hash: hashedAdmin, role: Role.DIRECTION, first_name: 'Direction', last_name: 'Générale', campus_id: campuses[0].campus_id, is_active: true },
  });
    // ── Users demo ──
  const hashedDemo = await bcrypt.hash('Demo1234!', 10);
  await prisma.user.create({
    data: { email: 'demo@novacampus.fr', password_hash: hashedDemo, role: Role.DEMO, first_name: 'Demo', last_name: 'Novacampus', campus_id: campuses[0].campus_id, is_active: true },
  });
  console.log('  ✅ Users admin/direction');

  // ── Étudiants + users + paiements + inscriptions + relances ──
  const hashedEtu = await bcrypt.hash('Etudiant1234!', 10);
  let totalStudents = 0, totalPayments = 0, totalEnrollments = 0, totalRelances = 0;
  const usedEmails = new Set<string>();
  let firstTestStudent: { email: string; statut: string } | null = null;

  for (const program of programs) {
    const courses = coursesByProgram.get(program.program_id)!;
    const n = int(CONFIG.STUDENTS_PER_PROGRAM);

    for (let i = 0; i < n; i++) {
      const firstName = faker.person.firstName();
      const lastName  = faker.person.lastName();
      let email: string;
      do {
        email = faker.internet.email({ firstName, lastName, provider: 'etu.novacampus.fr' }).toLowerCase();
      } while (usedEmails.has(email));
      usedEmails.add(email);

      const paymentStatus = pickWeighted(CONFIG.PAYMENT_DISTRIBUTION);

      const student = await prisma.student.create({
        data: {
          campus_id:         program.campus_id,
          program_id:        program.program_id,
          first_name:        firstName,
          last_name:         lastName,
          email,
          status:            faker.helpers.weightedArrayElement([
            { value: 'actif', weight: 9 }, { value: 'suspendu', weight: 1 },
          ]),
          birth_date:        faker.date.birthdate({ min: 18, max: 28, mode: 'age' }),
          enrollment_year:   faker.helpers.arrayElement([2022, 2023, 2024]),
          payment_status:    paymentStatus,
          address:           faker.location.streetAddress(),
          city:              faker.location.city(),
          postal_code:       faker.location.zipCode(),
          emergency_contact: faker.person.fullName(),
          emergency_phone:   faker.phone.number(),
        },
      });
      totalStudents++;
      if (!firstTestStudent) firstTestStudent = { email, statut: paymentStatus };

      await prisma.user.create({
        data: { email, password_hash: hashedEtu, role: Role.STUDENT, first_name: firstName, last_name: lastName, campus_id: program.campus_id, student_id: student.student_id, is_active: true },
      });

      // ── Paiements : 1 par semestre par année académique ──
      const montantAnnuel = Number(program.annual_tuition ?? 5000);
      for (const year of CONFIG.ACADEMIC_YEARS) {
        for (const semester of [1, 2]) {
          const yearStart   = new Date(`${year.split('-')[0]}-0${semester === 1 ? 9 : 2}-01`);
          const invoiceDate = semester === 2 ? new Date(`${year.split('-')[1]}-02-01`) : yearStart;
          const dueDate     = addDays(invoiceDate, 30);
          const isPast      = dueDate < new Date();

          // Les paiements 2023-2024 sont majoritairement payés ; le statut courant suit la distribution
          const status = year === '2023-2024'
            ? faker.helpers.weightedArrayElement([
                { value: 'paye', weight: 9 }, { value: 'escalade_humain', weight: 1 },
              ])
            : (isPast ? paymentStatus : 'en_attente');

          const isPaye = status === 'paye';

          const payment = await prisma.payment.create({
            data: {
              student_id:     student.student_id,
              invoice_date:   invoiceDate,
              due_date:       dueDate,
              amount:         montantAnnuel / 2,
              status,
              payment_date:   isPaye ? addDays(invoiceDate, faker.number.int({ min: 5, max: 28 })) : null,
              payment_method: isPaye ? faker.helpers.arrayElement(['virement', 'cb', 'cheque', 'prelevement']) : null,
              academic_year:  year,
              semester,
              notes:          null,
            },
          });
          totalPayments++;

          // Relances Postgres pour retards/escalades
          if (status === 'en_retard' || status === 'escalade_humain') {
            const joursRetard = Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / 86400000));
            const level = status === 'escalade_humain' ? 3 : joursRetard <= 7 ? 1 : joursRetard <= 30 ? 2 : 3;
            const nbRelances = Math.min(level, 3);

            for (let r = 1; r <= nbRelances; r++) {
              await prisma.relanceHistory.create({
                data: {
                  payment_id:    payment.payment_id,
                  sent_at:       addDays(dueDate, r * 7),
                  level:         r,
                  channel:       faker.helpers.arrayElement(['email', 'sms']),
                  draft_content: `Relance niveau ${r} — paiement de ${(montantAnnuel / 2).toFixed(2)} € en retard pour ${firstName} ${lastName} (${year} S${semester}).`,
                  status:        r === 3 && status === 'escalade_humain' ? 'en_attente' : 'envoye',
                  escalated:     r === 3,
                },
              });
              totalRelances++;
            }
          }
        }
      }

      // ── Inscriptions aux cours ──
      const nbInsc = Math.min(int(CONFIG.ENROLLMENTS_PER_STUDENT), courses.length);
      const selectedCourses = faker.helpers.arrayElements(courses, nbInsc);
      for (const course of selectedCourses) {
        const enrollStatus = faker.helpers.weightedArrayElement([
          { value: 'valide',    weight: 5 },
          { value: 'inscrit',   weight: 3 },
          { value: 'echec',     weight: 1 },
          { value: 'abandonne', weight: 1 },
        ]);
        const hasGrade = enrollStatus === 'valide' || enrollStatus === 'echec';

        await prisma.enrollment.create({
          data: {
            student_id:      student.student_id,
            course_id:       course.course_id,
            semester:        course.semester,
            academic_year:   '2024-2025',
            status:          enrollStatus,
            final_grade:     hasGrade
              ? (enrollStatus === 'echec'
                  ? faker.number.float({ min: 2, max: 9.5, fractionDigits: 1 })
                  : faker.number.float({ min: 10, max: 19.5, fractionDigits: 1 }))
              : undefined,
            // attendance_rate est un Decimal(4,2) : 100.00 dépasse la précision (max 99.99)
            attendance_rate: faker.number.float({ min: enrollStatus === 'abandonne' ? 10 : 55, max: 99.9, fractionDigits: 1 }),
            enrollment_date: new Date('2024-09-15'),
          },
        });
        totalEnrollments++;
      }
    }
  }

  console.log(`  ✅ Étudiants: ${totalStudents} (+ ${totalStudents} comptes users)`);
  console.log(`  ✅ Paiements: ${totalPayments}`);
  console.log(`  ✅ Relances (Postgres): ${totalRelances}`);
  console.log(`  ✅ Inscriptions: ${totalEnrollments}`);

  return firstTestStudent;
}

// ─── SEED MONGODB ────────────────────────────────────────────────────────────

async function seedMongo() {
  console.log('\n🍃 Seeding MongoDB...\n');
  await mongoose.connect(process.env.MONGO_URI!);

  await Facture.deleteMany({});
  await Relance.deleteMany({});

  const paiements = await prisma.payment.findMany({
    include: { student: { include: { program: true, campus: true } } },
  });

  let factureNum = 1;
  const facturesDocs: any[] = [];
  const relancesDocs: any[] = [];

  for (const p of paiements) {
    const s = p.student;
    facturesDocs.push({
      numero_facture:   `FAC-${p.academic_year.split('-')[0]}-${String(factureNum++).padStart(5, '0')}`,
      student_id:       s.student_id,
      payment_id:       p.payment_id,
      nom_etudiant:     `${s.first_name} ${s.last_name}`,
      programme:        s.program.program_name,
      campus:           s.campus.campus_name,
      annee_academique: p.academic_year,
      semestre:         p.semester,
      montant:          Number(p.amount),
      date_emission:    p.invoice_date,
      date_echeance:    p.due_date,
      statut:           p.status,
      encaissements: p.status === 'paye' && p.payment_date
        ? [{ date: p.payment_date, montant: Number(p.amount), methode: p.payment_method, reference: `REF-${faker.string.alphanumeric(8).toUpperCase()}` }]
        : [],
      metadata: { genere_le: new Date(), genere_par: 'seed:dev', source: 'inscription.creee' },
    });

    if (p.status === 'en_retard' || p.status === 'escalade_humain') {
      const joursRetard = Math.max(1, Math.floor((Date.now() - p.due_date.getTime()) / 86400000));
      const niveau = p.status === 'escalade_humain' ? 3 : joursRetard <= 7 ? 1 : joursRetard <= 30 ? 2 : 3;
      relancesDocs.push({
        payment_id:       p.payment_id,
        student_id:       s.student_id,
        nom_etudiant:     `${s.first_name} ${s.last_name}`,
        email_etudiant:   s.email,
        niveau,
        date_relance:     addDays(p.due_date, 7),
        contenu:          `Bonjour ${s.first_name}, votre paiement de ${Number(p.amount).toFixed(2)} € (${p.academic_year} S${p.semester}) est en retard de ${joursRetard} jours. Merci de régulariser votre situation. — Service Facturation`,
        statut:           niveau === 3 ? 'escalade' : 'envoyee',
        canal:            'email',
        genere_par_ia:    niveau >= 2,
        valide_par_admin: niveau === 1,
        montant_du:       Number(p.amount),
        jours_retard:     joursRetard,
      });
    }
  }

  // insertMany = bien plus rapide que des create unitaires sur ce volume
  await Facture.insertMany(facturesDocs);
  if (relancesDocs.length) await Relance.insertMany(relancesDocs);

  console.log(`  ✅ Factures Mongo: ${facturesDocs.length}`);
  console.log(`  ✅ Relances Mongo: ${relancesDocs.length}`);

  await mongoose.disconnect();
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Novacampus Alliance — Seed générative (branche dev)');
  console.log(`   Graine faker: ${CONFIG.SEED} (données reproductibles)\n`);

  try {
    console.log('🧹 Purge des tables existantes...');
    await prisma.relanceHistory.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.instructor.deleteMany({});
    await prisma.program.deleteMany({});
    await prisma.kpiDashboard.deleteMany({});
    await prisma.campus.deleteMany({});
    console.log('  ✅ Tables purgées');

    const testStudent = await seedPostgres();
    await seedMongo();

    console.log('\n✅ Seed terminée avec succès !');
    console.log('\n📋 Comptes de test :');
    console.log('   admin@novacampus.fr     / Admin1234!     (ADMIN)');
    console.log('   direction@novacampus.fr / Admin1234!     (DIRECTION)');
    if (testStudent) {
      console.log(`   ${testStudent.email} / Etudiant1234!  (STUDENT, paiement: ${testStudent.statut})`);
    }
    console.log('   (tous les étudiants ont le mot de passe Etudiant1234!)');
  } catch (err) {
    console.error('\n❌ Erreur seed :', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();