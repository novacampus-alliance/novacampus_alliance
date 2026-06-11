/**
 * Client HTTP des pages — branché sur les SEULS endpoints déclarés de la
 * plateforme (collection Postman « NovaCampus — Tous services »).
 *
 * Endpoints utilisés (via le proxy BFF /bff/* qui relaie vers le gateway en
 * ajoutant le Bearer du cookie httpOnly) :
 *  - Académique : /api/campus, /api/programs, /api/instructors, /api/students
 *    (+ /:id/dossier /:id/notes /:id/absences), /api/courses, /api/rooms
 *    (+ /available), /api/schedules (+ /conflicts), /api/enrollments
 *    (+ /:id/note, /:id/presence)
 *  - Facturation : /api/paiements (+ /:id, /en-retard, /etudiant/:id/historique)
 *  - Notifications : /api/notifications (+ /:id/lire, /internal)
 *
 * Stratégie : on interroge l'API via le proxy BFF. Si un appel échoue ou est
 * refusé, on renvoie une valeur vide (liste vide / null) — il n'y a plus de
 * données de démonstration locales.
 */

import { UserRole } from './auth';
import {
  AdminStudent,
  AppNotification,
  CourseGrade,
  DashboardStudent,
  EnrolledStudent,
  Invoice,
  InvoiceStatus,
  NotificationKind,
  PaymentAlert,
  PaymentRow,
  Room,
  ScheduleConflict,
  ScheduleSlot,
  StudentHistory,
  TeacherCourse,
  TeacherHistoryEntry,
  TranscriptEntry,
} from './types';

// ─── Transport ───────────────────────────────────────────────────────────────

const BFF = '/bff';

/** GET via le proxy BFF. Retourne null si l'API ne répond pas ou refuse. */
async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BFF}${path}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Écriture (POST/PUT/PATCH) via le proxy BFF. Retourne true si 2xx. */
async function apiSend(
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<boolean> {
  const result = await apiSendJson(method, path, body);
  return result.ok;
}

/** Écriture avec corps JSON de réponse (ex. POST /students). */
async function apiSendJson<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; data: T | null }> {
  try {
    const res = await fetch(`${BFF}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return { ok: false, data: null };
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: true, data };
  } catch {
    return { ok: false, data: null };
  }
}

// ─── Session & résolution d'identité ────────────────────────────────────────

export interface Session {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

let sessionCache: Session | null | undefined;

/** Utilisateur connecté, décodé du cookie httpOnly par /bff/session. */
export async function fetchSession(): Promise<Session | null> {
  if (sessionCache === undefined) {
    sessionCache = await apiGet<Session>('/session');
  }
  return sessionCache;
}

let studentIdCache: string | null | undefined;
let instructorIdCache: string | null | undefined;

/**
 * Retrouve le student_id du compte connecté en croisant l'email du JWT avec
 * GET /api/students. Le rôle STUDENT n'y a pas accès (403 backend) : on
 * retourne alors null et les pages concernées affichent une liste vide.
 */
async function resolveStudentId(): Promise<string | null> {
  if (studentIdCache !== undefined) return studentIdCache;
  const session = await fetchSession();
  if (!session) return (studentIdCache = null);
  const students = await apiGet<ApiStudent[]>('/students');
  const me = students?.find(
    (s) => s.email?.toLowerCase() === session.email.toLowerCase(),
  );
  studentIdCache = me?.student_id ?? null;
  return studentIdCache;
}

/** Même logique pour l'enseignant connecté via GET /api/instructors. */
async function resolveInstructorId(): Promise<string | null> {
  if (instructorIdCache !== undefined) return instructorIdCache;
  const session = await fetchSession();
  if (!session) return (instructorIdCache = null);
  const instructors = await apiGet<ApiInstructor[]>('/instructors');
  const me = instructors?.find(
    (i) => i.email?.toLowerCase() === session.email.toLowerCase(),
  );
  instructorIdCache = me?.instructor_id ?? null;
  return instructorIdCache;
}

// ─── Contrats backend (formes renvoyées par les services) ───────────────────

interface ApiCampus {
  campus_id: string;
  campus_name: string;
}

interface ApiProgram {
  program_id: string;
  campus_id: string;
  program_name: string;
}

interface ApiInstructor {
  instructor_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
}

interface ApiStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: string | null;
  enrollment_year?: number;
  payment_status?: string;
  campus?: { campus_id: string; campus_name: string } | null;
  program?: { program_id: string; program_name: string } | null;
  counts?: { inscriptions?: number };
}

interface ApiScheduleSlot {
  schedule_id: string;
  course_id: string;
  instructor_id: string;
  room_id: string;
  day_of_week: number;
  start_time?: string | null;
  end_time?: string | null;
  course?: {
    course_id: string;
    course_name: string;
    course_code?: string;
    program?: { program_id: string; program_name: string; campus_id: string };
  } | null;
  instructor?: { first_name: string; last_name: string } | null;
  room?: {
    room_id: string;
    room_name: string;
    building?: string | null;
    campus_id?: string;
  } | null;
}

interface ApiScheduleConflict {
  schedule_a: ApiScheduleSlot;
  schedule_b: ApiScheduleSlot;
  reason: string;
}

interface ApiRoom {
  room_id: string;
  room_name: string;
  capacity?: number | null;
  room_type?: string | null;
  campus?: { campus_name: string } | null;
  counts?: { creneaux?: number };
}

interface ApiCourse {
  course_id: string;
  course_code: string;
  course_name: string;
  instructor_id: string;
  semester?: number;
  program?: {
    program_id: string;
    program_name: string;
    campus?: { campus_name: string } | null;
  } | null;
  room?: { room_id: string; room_name: string } | null;
  counts?: { inscriptions?: number };
}

interface ApiEnrollment {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  semester?: number | null;
  academic_year?: string | null;
  final_grade?: string | number | null;
  attendance_rate?: string | number | null;
  student?: {
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  course?: {
    course_id: string;
    course_name: string;
    course_code: string;
  } | null;
}

interface ApiStudentNote {
  enrollment_id: string;
  final_grade: string | number | null;
  academic_year?: string | null;
  semester?: number | null;
  course?: { course_id: string; course_name: string; course_code: string };
}

interface ApiStudentAbsence extends ApiStudentNote {
  attendance_rate: string | number | null;
}

interface ApiPaiement {
  _id: string;
  studentId: string;
  montantTotal: number;
  montantPaye?: number;
  soldeRestant?: number;
  dateEmission: string;
  dateEcheance: string;
  datePaiement?: string;
  statut: string;
  numeroFacture?: string;
  description?: string;
  echeances?: { numero: number; montant: number }[];
  relances?: unknown[];
}

interface ApiNotification {
  notification_id: string;
  user_id: string;
  type: string;
  message: string;
  sent_at: string;
  read: boolean;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

/** Extrait HH:mm d'un champ Time Prisma sérialisé ("1970-01-01T08:00:00.000Z"). */
function timeParts(value: string | null | undefined): { h: number; m: number } {
  const match = /(\d{2}):(\d{2})/.exec(value ?? '');
  return match ? { h: Number(match[1]), m: Number(match[2]) } : { h: 8, m: 0 };
}

function timeToHHmm(value: string | null | undefined): string {
  const { h, m } = timeParts(value);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Date ISO du créneau dans la semaine courante (day_of_week : 1 = lundi). */
function slotDateISO(dayOfWeek: number, time: string | null | undefined): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const d = new Date(monday);
  d.setDate(monday.getDate() + (dayOfWeek - 1));
  const { h, m } = timeParts(time);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function mapSchedule(s: ApiScheduleSlot): ScheduleSlot {
  return {
    id: s.schedule_id,
    courseId: s.course_id,
    courseName: s.course?.course_name ?? 'Cours',
    instructorId: s.instructor_id,
    instructorName: s.instructor
      ? `${s.instructor.first_name} ${s.instructor.last_name}`
      : '—',
    roomId: s.room_id,
    roomName: s.room?.room_name ?? '—',
    campus: s.room?.building ?? s.course?.program?.program_name ?? '—',
    startsAt: slotDateISO(s.day_of_week, s.start_time),
    endsAt: slotDateISO(s.day_of_week, s.end_time),
  };
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function mapPaymentStatus(statut: string | undefined): InvoiceStatus {
  if (statut === 'paye' || statut === 'a_jour') return 'PAID';
  if (statut === 'en_retard') return 'OVERDUE';
  return 'PENDING';
}

function mapStudentStatus(status: string | null | undefined): AdminStudent['status'] {
  const s = (status ?? '').toLowerCase();
  if (s.startsWith('diplom')) return 'DIPLOME';
  if (s === 'inactif' || s === 'suspendu' || s === 'abandonne') return 'INACTIF';
  return 'ACTIF';
}

function mapPaiement(p: ApiPaiement): Invoice {
  return {
    id: p._id,
    reference: p.numeroFacture ?? p._id,
    studentId: p.studentId,
    amount: p.montantTotal,
    currency: 'EUR',
    status: mapPaymentStatus(p.statut),
    issuedAt: p.dateEmission,
    dueAt: p.dateEcheance,
    paidAt: p.datePaiement ?? undefined,
    description: p.description ?? 'Frais de scolarite',
    lines: p.echeances?.length
      ? p.echeances.map((e) => ({
          label: `Echeance ${e.numero}`,
          quantity: 1,
          unitPrice: e.montant,
        }))
      : [
          {
            label: p.description ?? 'Frais de scolarite',
            quantity: 1,
            unitPrice: p.montantTotal,
          },
        ],
  };
}

function mapCourse(c: ApiCourse, enrollments: ApiEnrollment[]): TeacherCourse {
  const own = enrollments.filter((e) => e.course_id === c.course_id);
  const grades = own
    .map((e) => toNumber(e.final_grade))
    .filter((g): g is number => g != null);
  return {
    id: c.course_id,
    code: c.course_code,
    name: c.course_name,
    campus: c.program?.campus?.campus_name ?? '—',
    program: c.program?.program_name ?? '—',
    enrolledCount: c.counts?.inscriptions ?? own.length,
    successRate: grades.length
      ? grades.filter((g) => g >= 10).length / grades.length
      : 0,
    averageGrade: grades.length
      ? grades.reduce((a, b) => a + b, 0) / grades.length
      : 0,
    roomId: c.room?.room_id,
    roomName: c.room?.room_name,
  };
}

// ─── Plannings ───────────────────────────────────────────────────────────────

async function fetchAllSchedules(): Promise<ScheduleSlot[]> {
  const schedules = await apiGet<ApiScheduleSlot[]>('/schedules');
  return schedules ? schedules.map(mapSchedule) : [];
}

/** EDT du portail étudiant — GET /api/schedules (lecture autorisée au rôle STUDENT). */
export async function fetchSchedule(): Promise<ScheduleSlot[]> {
  return fetchAllSchedules();
}

/** EDT enseignant — GET /api/schedules filtré sur l'enseignant connecté. */
export async function fetchInstructorSchedule(): Promise<ScheduleSlot[]> {
  const schedules = await apiGet<ApiScheduleSlot[]>('/schedules');
  if (!schedules) return [];
  const instructorId = await resolveInstructorId();
  const own = instructorId
    ? schedules.filter((s) => s.instructor_id === instructorId)
    : schedules;
  return (own.length ? own : schedules).map(mapSchedule);
}

export async function fetchAdminSchedule(): Promise<ScheduleSlot[]> {
  return fetchAllSchedules();
}

/**
 * Conflits — GET /api/schedules/conflicts, enrichis avec les salles libres
 * (GET /api/rooms/available) comme suggestions de remplacement.
 */
/** Campus — GET /api/campus. */
export async function fetchCampuses(): Promise<{ id: string; name: string }[]> {
  const campuses = await apiGet<ApiCampus[]>('/campus');
  return (campuses ?? []).map((c) => ({ id: c.campus_id, name: c.campus_name }));
}

/** Programmes — GET /api/programs (optionnellement filtrés par campus). */
export async function fetchPrograms(
  campusId?: string,
): Promise<{ id: string; name: string }[]> {
  const path = campusId
    ? `/programs?campus_id=${encodeURIComponent(campusId)}`
    : '/programs';
  const programs = await apiGet<ApiProgram[]>(path);
  return (programs ?? []).map((p) => ({ id: p.program_id, name: p.program_name }));
}

/** Cours — GET /api/courses (optionnellement filtrés par programme). */
export async function fetchCourses(
  programId?: string,
): Promise<{ id: string; code: string; name: string }[]> {
  const courses = await apiGet<ApiCourse[]>('/courses');
  if (!courses) return [];
  const filtered = programId
    ? courses.filter((c) => c.program?.program_id === programId)
    : courses;
  return filtered.map((c) => ({
    id: c.course_id,
    code: c.course_code,
    name: c.course_name,
  }));
}

/** Enseignants — GET /api/instructors. */
export async function fetchInstructors(): Promise<
  { id: string; name: string }[]
> {
  const instructors = await apiGet<ApiInstructor[]>('/instructors');
  return (instructors ?? []).map((i) => ({
    id: i.instructor_id,
    name: `${i.first_name} ${i.last_name}`,
  }));
}

/** Met à jour la salle d'un créneau — PUT /api/schedules/:id. */
export async function updateScheduleRoom(
  scheduleId: string,
  roomId: string,
): Promise<boolean> {
  return apiSend('PUT', `/schedules/${scheduleId}`, { room_id: roomId });
}

/** Crée un créneau — POST /api/schedules. */
export async function createSchedule(payload: {
  courseId: string;
  instructorId: string;
  roomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): Promise<boolean> {
  const year = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
  return apiSend('POST', '/schedules', {
    course_id: payload.courseId,
    instructor_id: payload.instructorId,
    room_id: payload.roomId,
    day_of_week: payload.dayOfWeek,
    start_time: payload.startTime,
    end_time: payload.endTime,
    academic_year: year,
    semester: 1,
    status: 'planifie',
  });
}

/** Met à jour un créneau — PUT /api/schedules/:id. */
export async function updateSchedule(
  scheduleId: string,
  payload: {
    courseId?: string;
    instructorId?: string;
    roomId?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
  },
): Promise<boolean> {
  return apiSend('PUT', `/schedules/${scheduleId}`, {
    ...(payload.courseId ? { course_id: payload.courseId } : {}),
    ...(payload.instructorId ? { instructor_id: payload.instructorId } : {}),
    ...(payload.roomId ? { room_id: payload.roomId } : {}),
    ...(payload.dayOfWeek ? { day_of_week: payload.dayOfWeek } : {}),
    ...(payload.startTime ? { start_time: payload.startTime } : {}),
    ...(payload.endTime ? { end_time: payload.endTime } : {}),
  });
}

export async function fetchConflicts(): Promise<ScheduleConflict[]> {
  const conflicts = await apiGet<ApiScheduleConflict[]>('/schedules/conflicts');
  if (!conflicts) return [];

  return Promise.all(
    conflicts.map(async (c) => {
      const a = c.schedule_a;
      let suggestedRooms: ScheduleConflict['suggestedRooms'] = [];
      const campusId = a.room?.campus_id;
      if (campusId) {
        const query = new URLSearchParams({
          campus_id: campusId,
          day_of_week: String(a.day_of_week),
          start_time: timeToHHmm(a.start_time),
          end_time: timeToHHmm(a.end_time),
        });
        const rooms = await apiGet<ApiRoom[]>(`/rooms/available?${query}`);
        suggestedRooms = (rooms ?? []).slice(0, 3).map((r) => ({
          roomId: r.room_id,
          roomName: r.room_name,
          capacity: r.capacity ?? 0,
        }));
      }
      return {
        id: `${a.schedule_id}-${c.schedule_b.schedule_id}`,
        severity: 'CRITICAL' as const,
        reason: c.reason,
        slots: [mapSchedule(a), mapSchedule(c.schedule_b)],
        suggestedRooms,
      };
    }),
  );
}

// ─── Notes & relevé étudiant ─────────────────────────────────────────────────

/** Notes réelles : GET /api/students/:id/notes + /absences (taux de présence). */
async function fetchStudentGrades(studentId: string): Promise<CourseGrade[]> {
  const [notes, absences] = await Promise.all([
    apiGet<ApiStudentNote[]>(`/students/${studentId}/notes`),
    apiGet<ApiStudentAbsence[]>(`/students/${studentId}/absences`),
  ]);
  if (!notes) return [];

  const attendanceByEnrollment = new Map(
    (absences ?? []).map((a) => [a.enrollment_id, toNumber(a.attendance_rate)]),
  );

  return notes.map((n) => {
    const grade = toNumber(n.final_grade);
    const attendance = attendanceByEnrollment.get(n.enrollment_id);
    return {
      courseId: n.course?.course_id ?? n.enrollment_id,
      courseCode: n.course?.course_code ?? '—',
      courseName: n.course?.course_name ?? 'Cours',
      finalGrade: grade,
      maxGrade: 20,
      attendanceRate: attendance != null ? attendance / 100 : 1,
      status: grade == null ? 'EN_COURS' : grade >= 10 ? 'VALIDE' : 'ECHEC',
      // Les crédits ECTS ne sont pas exposés par /students/:id/notes.
      ects: 0,
      semester: n.semester != null ? `S${n.semester}` : (n.academic_year ?? '—'),
    } satisfies CourseGrade;
  });
}

export async function fetchGrades(): Promise<CourseGrade[]> {
  const studentId = await resolveStudentId();
  if (!studentId) return [];
  return fetchStudentGrades(studentId);
}

export async function fetchTranscript(): Promise<TranscriptEntry[]> {
  const studentId = await resolveStudentId();
  if (!studentId) return [];
  const grades = await fetchStudentGrades(studentId);
  if (grades.length === 0) return [];

  const bySemester = new Map<string, CourseGrade[]>();
  for (const g of grades) {
    const list = bySemester.get(g.semester) ?? [];
    list.push(g);
    bySemester.set(g.semester, list);
  }
  return Array.from(bySemester.entries()).map(([semester, courses]) => {
    const graded = courses.filter((c) => c.finalGrade != null);
    return {
      semester,
      courses,
      averageGrade: graded.length
        ? graded.reduce((a, c) => a + (c.finalGrade ?? 0), 0) / graded.length
        : 0,
      ectsEarned: courses.reduce((a, c) => a + c.ects, 0),
    };
  });
}

// ─── Facturation ─────────────────────────────────────────────────────────────

/** Factures de l'étudiant connecté — GET /api/paiements/etudiant/:id/historique. */
export async function fetchInvoices(): Promise<Invoice[]> {
  const studentId = await resolveStudentId();
  if (!studentId) return [];
  const history = await apiGet<{ paiements: ApiPaiement[] }>(
    `/paiements/etudiant/${studentId}/historique`,
  );
  return history?.paiements ? history.paiements.map(mapPaiement) : [];
}

/** Détail d'une facture — GET /api/paiements/:id. */
export async function fetchInvoice(id: string): Promise<Invoice | null> {
  const paiement = await apiGet<ApiPaiement>(`/paiements/${id}`);
  if (paiement?._id) return mapPaiement(paiement);
  const all = await fetchInvoices();
  return all.find((inv) => inv.id === id) ?? null;
}

/** Tableau des paiements (admin) — GET /api/paiements, noms via GET /api/students. */
export async function fetchPayments(): Promise<PaymentRow[]> {
  const result = await apiGet<{ data: ApiPaiement[] }>('/paiements');
  if (!result?.data) return [];

  const students = await apiGet<ApiStudent[]>('/students');
  const byId = new Map((students ?? []).map((s) => [s.student_id, s]));

  return result.data.map((p) => {
    const student = byId.get(p.studentId);
    return {
      invoiceId: p._id,
      reference: p.numeroFacture ?? p._id,
      studentName: student
        ? `${student.first_name} ${student.last_name}`
        : p.studentId,
      studentId: p.studentId,
      campus: student?.campus?.campus_name ?? '—',
      amount: p.montantTotal,
      status: mapPaymentStatus(p.statut),
      dueAt: p.dateEcheance,
      remindersSent: p.relances?.length ?? 0,
    };
  });
}

/** Alertes de paiement — GET /api/paiements/en-retard. */
export async function fetchPaymentAlerts(): Promise<PaymentAlert[]> {
  const overdue = await apiGet<ApiPaiement[]>('/paiements/en-retard');
  if (!overdue) return [];

  const students = await apiGet<ApiStudent[]>('/students');
  const byId = new Map((students ?? []).map((s) => [s.student_id, s]));

  return overdue.map((p) => {
    const student = byId.get(p.studentId);
    return {
      id: p._id,
      studentId: p.studentId,
      studentName: student
        ? `${student.first_name} ${student.last_name}`
        : p.studentId,
      amount: p.soldeRestant ?? p.montantTotal,
      detail: p.description ?? `Facture ${p.numeroFacture ?? ''} en retard`,
      reminderLevel: Math.max(1, p.relances?.length ?? 1),
    };
  });
}

/**
 * Relance manuelle : POST /api/notifications/internal (création de
 * notification, endpoint inter-services déclaré).
 */
export async function triggerReminder(invoiceId: string): Promise<{ ok: boolean }> {
  const session = await fetchSession();
  if (!session) return { ok: false };
  const ok = await apiSend('POST', '/notifications/internal', {
    user_id: session.id,
    type: 'relance',
    message: `Relance manuelle envoyee pour la facture ${invoiceId}`,
    details: 'Relance declenchee depuis le portail administration',
  });
  return { ok };
}

// ─── Cours enseignant ────────────────────────────────────────────────────────

/** Cours de l'enseignant connecté — GET /api/courses + stats via /api/enrollments. */
export async function fetchTeacherCourses(): Promise<TeacherCourse[]> {
  const courses = await apiGet<ApiCourse[]>('/courses');
  if (!courses) return [];

  const [instructorId, enrollments] = await Promise.all([
    resolveInstructorId(),
    apiGet<ApiEnrollment[]>('/enrollments'),
  ]);
  const own = instructorId
    ? courses.filter((c) => c.instructor_id === instructorId)
    : courses;
  return (own.length ? own : courses).map((c) =>
    mapCourse(c, enrollments ?? []),
  );
}

/** Détail d'un cours — GET /api/courses/:id. */
export async function fetchTeacherCourse(id: string): Promise<TeacherCourse | null> {
  const course = await apiGet<ApiCourse>(`/courses/${id}`);
  if (course?.course_id) {
    const enrollments = await apiGet<ApiEnrollment[]>(
      `/enrollments?course_id=${encodeURIComponent(id)}`,
    );
    return mapCourse(course, enrollments ?? []);
  }
  const all = await fetchTeacherCourses();
  return all.find((c) => c.id === id) ?? null;
}

/** Salles — GET /api/rooms. */
export async function fetchRooms(): Promise<Room[]> {
  const rooms = await apiGet<ApiRoom[]>('/rooms');
  if (!rooms) return [];
  return rooms.map((r) => {
    const type = (r.room_type ?? '').toLowerCase();
    return {
      id: r.room_id,
      name: r.room_name,
      campus: r.campus?.campus_name ?? '—',
      capacity: r.capacity ?? 0,
      type: type.includes('amphi')
        ? 'Amphi'
        : type.includes('tp')
          ? 'Salle TP'
          : type.includes('labo')
            ? 'Labo'
            : 'Salle TD',
      // Approximation : 20 créneaux possibles par semaine et par salle.
      occupancy: Math.min(1, (r.counts?.creneaux ?? 0) / 20),
    };
  });
}

/** Historique des classes — agrégé depuis GET /api/enrollments. */
export async function fetchTeacherHistory(): Promise<TeacherHistoryEntry[]> {
  const enrollments = await apiGet<ApiEnrollment[]>('/enrollments');
  if (!enrollments) return [];

  const groups = new Map<string, ApiEnrollment[]>();
  for (const e of enrollments) {
    const key = `${e.course_id}|${e.academic_year ?? ''}|${e.semester ?? ''}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    const grades = group
      .map((e) => toNumber(e.final_grade))
      .filter((g): g is number => g != null);
    return {
      id: `${first.course_id}-${first.academic_year ?? 'na'}-${first.semester ?? 'na'}`,
      semester: `${first.academic_year ?? '—'}${first.semester != null ? ` S${first.semester}` : ''}`,
      courseCode: first.course?.course_code ?? '—',
      courseName: first.course?.course_name ?? 'Cours',
      group: first.academic_year ?? '—',
      campus: '—',
      studentsCount: group.length,
      averageGrade: grades.length
        ? grades.reduce((a, b) => a + b, 0) / grades.length
        : 0,
      successRate: grades.length
        ? grades.filter((g) => g >= 10).length / grades.length
        : 0,
    } satisfies TeacherHistoryEntry;
  });
}

/** Parcours des étudiants — agrégé depuis GET /api/enrollments. */
export async function fetchStudentHistory(): Promise<StudentHistory[]> {
  const enrollments = await apiGet<ApiEnrollment[]>('/enrollments');
  if (!enrollments) return [];

  const byStudent = new Map<string, ApiEnrollment[]>();
  for (const e of enrollments) {
    const list = byStudent.get(e.student_id) ?? [];
    list.push(e);
    byStudent.set(e.student_id, list);
  }

  return Array.from(byStudent.values()).map((group) => {
    const student = group[0].student;
    return {
      id: group[0].student_id,
      name: student ? `${student.first_name} ${student.last_name}` : '—',
      email: student?.email ?? '—',
      courses: group.map((e) => ({
        semester: `${e.academic_year ?? '—'}${e.semester != null ? ` S${e.semester}` : ''}`,
        courseCode: e.course?.course_code ?? '—',
        courseName: e.course?.course_name ?? 'Cours',
        grade: toNumber(e.final_grade),
        attendanceRate: (toNumber(e.attendance_rate) ?? 100) / 100,
      })),
    } satisfies StudentHistory;
  });
}

/**
 * Création/édition d'un cours — POST /api/courses et PUT /api/courses/:id.
 * Les identifiants requis par le backend (program_id, instructor_id) sont
 * résolus via GET /api/programs et /api/instructors.
 */
export async function saveTeacherCourse(
  payload: Omit<TeacherCourse, 'id' | 'enrolledCount' | 'successRate' | 'averageGrade'>,
  mode: 'create' | 'edit',
  id?: string,
): Promise<{ ok: boolean }> {
  if (mode === 'edit' && id) {
    const ok = await apiSend('PUT', `/courses/${id}`, {
      course_name: payload.name,
      course_code: payload.code,
      ...(payload.roomId ? { room_id: payload.roomId } : {}),
    });
    return { ok };
  }

  const [programs, instructors, session] = await Promise.all([
    apiGet<ApiProgram[]>('/programs'),
    apiGet<ApiInstructor[]>('/instructors'),
    fetchSession(),
  ]);
  const program =
    programs?.find(
      (p) => p.program_name.toLowerCase() === payload.program.toLowerCase(),
    ) ?? programs?.[0];
  const instructor =
    instructors?.find(
      (i) => i.email?.toLowerCase() === session?.email.toLowerCase(),
    ) ?? instructors?.[0];
  if (!program || !instructor) return { ok: false };

  const ok = await apiSend('POST', '/courses', {
    program_id: program.program_id,
    instructor_id: instructor.instructor_id,
    course_name: payload.name,
    course_code: payload.code,
    semester: 1,
    credits: 3,
    status: 'actif',
    ...(payload.roomId ? { room_id: payload.roomId } : {}),
  });
  return { ok };
}

/** Affecte une salle à un cours — PUT /api/courses/:id (champ room_id). */
export async function assignCourseRoom(
  courseId: string,
  roomId: string,
  resources: string[],
): Promise<{ ok: boolean }> {
  // Les ressources pédagogiques n'ont pas d'endpoint déclaré : état UI local.
  void resources;
  const ok = await apiSend('PUT', `/courses/${courseId}`, { room_id: roomId });
  return { ok };
}

/**
 * Étudiants inscrits à un cours — GET /api/enrollments?course_id=…
 * L'`id` retourné est l'enrollment_id : c'est lui qu'attendent les endpoints
 * déclarés de saisie (PUT /api/enrollments/:id/note et /:id/presence).
 */
export async function fetchEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
  const enrollments = await apiGet<ApiEnrollment[]>(
    `/enrollments?course_id=${encodeURIComponent(courseId)}`,
  );
  if (!enrollments) return [];
  return enrollments.map((e) => ({
    id: e.enrollment_id,
    firstName: e.student?.first_name ?? '—',
    lastName: e.student?.last_name ?? '—',
    email: e.student?.email ?? '—',
    currentGrade: toNumber(e.final_grade),
    attendanceRate: (toNumber(e.attendance_rate) ?? 100) / 100,
  }));
}

/**
 * Saisie des notes/présences — PUT /api/enrollments/:id/note et
 * PUT /api/enrollments/:id/presence (endpoints déclarés, rôle enseignant).
 * `rows[].studentId` porte l'enrollment_id fourni par fetchEnrolledStudents.
 */
export async function saveCourseGrades(
  _courseId: string,
  rows: { studentId: string; grade: number | null; attendanceRate: number }[],
): Promise<{ ok: boolean; saved: number }> {
  let saved = 0;
  await Promise.all(
    rows.map(async (row) => {
      const noteOk =
        row.grade == null
          ? true
          : await apiSend('PUT', `/enrollments/${row.studentId}/note`, {
              final_grade: row.grade,
            });
      // attendance_rate est un Decimal(4,2) côté backend : borné à 99.99.
      const presenceOk = await apiSend(
        'PUT',
        `/enrollments/${row.studentId}/presence`,
        { attendance_rate: Math.min(99.99, Math.round(row.attendanceRate * 10000) / 100) },
      );
      if (noteOk && presenceOk) saved += 1;
    }),
  );
  return { ok: saved === rows.length, saved };
}

// ─── Étudiants (administration) ──────────────────────────────────────────────

function mapAdminStudent(s: ApiStudent): AdminStudent {
  return {
    id: s.student_id,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email,
    campus: s.campus?.campus_name ?? '—',
    program: s.program?.program_name ?? '—',
    status: mapStudentStatus(s.status),
    enrolledCourses: s.counts?.inscriptions ?? 0,
  };
}

/** Liste des étudiants — GET /api/students. */
export async function fetchAdminStudents(): Promise<AdminStudent[]> {
  const students = await apiGet<ApiStudent[]>('/students');
  return students ? students.map(mapAdminStudent) : [];
}

/** Détail d'un étudiant — GET /api/students/:id. */
export async function fetchAdminStudent(id: string): Promise<AdminStudent | null> {
  const student = await apiGet<ApiStudent>(`/students/${id}`);
  if (student?.student_id) return mapAdminStudent(student);
  const all = await fetchAdminStudents();
  return all.find((s) => s.id === id) ?? null;
}

/**
 * Création/édition d'une fiche étudiant — POST /api/students et
 * PUT /api/students/:id. Campus et programme sont résolus par nom via
 * GET /api/campus et GET /api/programs.
 */
export async function saveAdminStudent(
  payload: {
    firstName: string;
    lastName: string;
    email: string;
    campus: string;
    program: string;
    status: AdminStudent['status'];
  },
  mode: 'create' | 'edit',
  id?: string,
): Promise<{ ok: boolean; id?: string }> {
  const status =
    payload.status === 'DIPLOME'
      ? 'diplome'
      : payload.status === 'INACTIF'
        ? 'inactif'
        : 'actif';

  if (mode === 'edit' && id) {
    const ok = await apiSend('PUT', `/students/${id}`, {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      status,
    });
    return { ok, id };
  }

  const campuses = await apiGet<ApiCampus[]>('/campus');
  const campus =
    campuses?.find((c) =>
      c.campus_name.toLowerCase().includes(payload.campus.toLowerCase()),
    ) ?? campuses?.[0];
  if (!campus) return { ok: false };

  const programs = await apiGet<ApiProgram[]>(
    `/programs?campus_id=${encodeURIComponent(campus.campus_id)}`,
  );
  const program =
    programs?.find(
      (p) => p.program_name.toLowerCase() === payload.program.toLowerCase(),
    ) ?? programs?.[0];
  if (!program) return { ok: false };

  const result = await apiSendJson<ApiStudent>('POST', '/students', {
    campus_id: campus.campus_id,
    program_id: program.program_id,
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    enrollment_year: new Date().getFullYear(),
    payment_status: 'a_jour',
    status,
  });
  return { ok: result.ok, id: result.data?.student_id };
}

/** Inscriptions aux cours — POST /api/enrollments (une par cours). */
export async function createEnrollments(
  studentId: string,
  courseIds: string[],
): Promise<{ ok: boolean; created: number }> {
  if (courseIds.length === 0) return { ok: true, created: 0 };
  const year = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
  let created = 0;
  await Promise.all(
    courseIds.map(async (courseId) => {
      const ok = await apiSend('POST', '/enrollments', {
        student_id: studentId,
        course_id: courseId,
        academic_year: year,
        semester: 1,
        enrollment_date: new Date().toISOString().slice(0, 10),
        status: 'inscrit',
      });
      if (ok) created += 1;
    }),
  );
  return { ok: created === courseIds.length, created };
}

/** Vue synthétique administration — GET /api/students + relances via /paiements/en-retard. */
export async function fetchDashboardStudents(): Promise<DashboardStudent[]> {
  const [students, overdue] = await Promise.all([
    apiGet<ApiStudent[]>('/students'),
    apiGet<ApiPaiement[]>('/paiements/en-retard'),
  ]);
  if (!students) return [];

  const remindersByStudent = new Map<string, number>();
  for (const p of overdue ?? []) {
    remindersByStudent.set(
      p.studentId,
      Math.max(remindersByStudent.get(p.studentId) ?? 0, p.relances?.length ?? 1),
    );
  }

  return students.map((s) => {
    const reminders = remindersByStudent.get(s.student_id) ?? 0;
    const paymentStatus =
      reminders > 0 ? 'OVERDUE' : mapPaymentStatus(s.payment_status);
    return {
      id: s.student_id,
      name: `${s.first_name} ${s.last_name}`,
      email: s.email,
      campus: s.campus?.campus_name ?? '—',
      filiere: s.program?.program_name ?? '—',
      promotion: s.enrollment_year ? String(s.enrollment_year) : '—',
      paymentStatus,
      reminders,
    };
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

const NOTIFICATION_KIND: Record<string, NotificationKind> = {
  edt: 'SCHEDULE',
  paiement: 'PAYMENT',
  relance: 'DEADLINE',
  alerte: 'CONFLICT',
};

const NOTIFICATION_TITLE: Record<NotificationKind, string> = {
  SCHEDULE: 'Emploi du temps',
  DEADLINE: 'Echeance',
  GRADE: 'Notes',
  PAYMENT: 'Paiement',
  CONFLICT: 'Alerte',
  REPORT: 'Information',
};

/** Notifications de l'utilisateur connecté — GET /api/notifications. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const result = await apiGet<{ data: ApiNotification[] }>('/notifications');
  if (!result?.data) return [];

  const session = await fetchSession();
  const own = session
    ? result.data.filter((n) => n.user_id === session.id)
    : result.data;

  return own.map((n) => {
    const kind = NOTIFICATION_KIND[n.type?.toLowerCase()] ?? 'REPORT';
    return {
      id: n.notification_id,
      kind,
      title: NOTIFICATION_TITLE[kind],
      detail: n.message,
      date: n.sent_at,
      read: n.read,
    };
  });
}

/** Marque une notification comme lue — PUT /api/notifications/:id/lire. */
export async function markNotificationRead(id: string): Promise<void> {
  await apiSend('PUT', `/notifications/${id}/lire`);
}
