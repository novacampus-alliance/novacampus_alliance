"use strict";
/**
 * Insère un conflit EDT de test pour l'agent IA M7.
 * Commande : npm run prisma:seed:m7-conflict
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("@prisma/client");
function loadEnv() {
    const envPath = (0, path_1.resolve)(__dirname, '../.env');
    if (!(0, fs_1.existsSync)(envPath))
        return;
    for (const line of (0, fs_1.readFileSync)(envPath, 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1)
            continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key])
            process.env[key] = value;
    }
}
loadEnv();
const prisma = new client_1.PrismaClient();
const ACADEMIC_YEAR = 'M7-TEST';
function parseTime(time) {
    const normalized = time.length === 5 ? `${time}:00` : time;
    return new Date(`1970-01-01T${normalized}.000Z`);
}
async function main() {
    const campus = await prisma.campus.findFirst({ orderBy: { campus_name: 'asc' } });
    if (!campus) {
        throw new Error("Aucun campus — exécutez npm run prisma:seed d'abord.");
    }
    const program = await prisma.program.findFirst({
        where: { campus_id: campus.campus_id },
    });
    if (!program) {
        throw new Error('Aucun programme — créez des données académiques de base.');
    }
    const instructor = await prisma.instructor.findFirst();
    if (!instructor) {
        throw new Error('Aucun enseignant en base.');
    }
    await prisma.schedule.deleteMany({ where: { academic_year: ACADEMIC_YEAR } });
    let roomConflict = await prisma.room.findFirst({
        where: { campus_id: campus.campus_id, room_name: 'M7 Salle Conflit' },
    });
    if (!roomConflict) {
        roomConflict = await prisma.room.create({
            data: {
                campus_id: campus.campus_id,
                room_name: 'M7 Salle Conflit',
                capacity: 30,
                status: 'disponible',
            },
        });
    }
    let roomFree = await prisma.room.findFirst({
        where: { campus_id: campus.campus_id, room_name: 'M7 Salle Libre' },
    });
    if (!roomFree) {
        roomFree = await prisma.room.create({
            data: {
                campus_id: campus.campus_id,
                room_name: 'M7 Salle Libre',
                capacity: 40,
                status: 'disponible',
            },
        });
    }
    const suffix = Date.now();
    const courseA = await prisma.course.create({
        data: {
            program_id: program.program_id,
            instructor_id: instructor.instructor_id,
            course_name: 'M7 Cours A',
            course_code: `M7A-${suffix}`,
            semester: 1,
            credits: 3,
            status: 'actif',
        },
    });
    const courseB = await prisma.course.create({
        data: {
            program_id: program.program_id,
            instructor_id: instructor.instructor_id,
            course_name: 'M7 Cours B',
            course_code: `M7B-${suffix}`,
            semester: 1,
            credits: 3,
            status: 'actif',
        },
    });
    const slot = {
        room_id: roomConflict.room_id,
        day_of_week: 2,
        start_time: parseTime('14:00'),
        end_time: parseTime('16:00'),
        academic_year: ACADEMIC_YEAR,
        status: 'planifie',
    };
    const scheduleA = await prisma.schedule.create({
        data: {
            ...slot,
            course_id: courseA.course_id,
            instructor_id: instructor.instructor_id,
        },
    });
    const scheduleB = await prisma.schedule.create({
        data: {
            ...slot,
            course_id: courseB.course_id,
            instructor_id: instructor.instructor_id,
        },
    });
    console.log('Seed M7 conflit EDT — OK');
    console.log(`  campus_id     : ${campus.campus_id}`);
    console.log(`  schedule_a_id : ${scheduleA.schedule_id}`);
    console.log(`  schedule_b_id : ${scheduleB.schedule_id}`);
    console.log(`  salle libre   : ${roomFree.room_name} (${roomFree.room_id})`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
