/**
 * Client HTTP pour les pages.
 *
 * Stratégie : on appelle l'API gateway en premier ; si elle répond mal ou
 * que le backend est absent on retombe sur des mocks locaux pour que les
 * pages restent démontrables.
 *
 * Les endpoints réels (students, rooms, conflicts) passent par des
 * transformers qui adaptent la forme du backend à celle attendue par le
 * frontend.
 */

import { UserRole } from './auth';
import {
  MOCK_ADMIN_STUDENTS,
  MOCK_CONFLICTS,
  MOCK_DASHBOARD_STUDENTS,
  MOCK_ENROLLED_STUDENTS,
  MOCK_GRADES,
  MOCK_INVOICES,
  MOCK_NOTIFICATIONS,
  MOCK_PAYMENT_ALERTS,
  MOCK_PAYMENTS,
  MOCK_ROOMS,
  MOCK_SCHEDULE,
  MOCK_STUDENT_HISTORY,
  MOCK_TEACHER_COURSES,
  MOCK_TEACHER_HISTORY,
  MOCK_TRANSCRIPT,
} from './mock-data';
import {
  AdminStudent,
  AppNotification,
  CourseGrade,
  DashboardStudent,
  EnrolledStudent,
  Invoice,
  InvoiceStatus,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BackendRecord = Record<string, unknown>;

async function tryFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// ─── Transformers : Backend → Frontend ───────────────────────────────────────

function transformStudent(s: BackendRecord): AdminStudent {
  const campus = s.campus as { campus_name?: string } | null;
  const program = s.program as { program_name?: string } | null;
  const counts = s.counts as { inscriptions?: number } | null;
  return {
    id: String(s.student_id ?? s.id ?? ''),
    firstName: String(s.first_name ?? s.firstName ?? ''),
    lastName: String(s.last_name ?? s.lastName ?? ''),
    email: String(s.email ?? ''),
    campus: campus?.campus_name ?? String(s.campus_id ?? s.campus ?? ''),
    program: program?.program_name ?? String(s.program_id ?? s.program ?? ''),
    status: (s.status as AdminStudent['status']) ?? 'INACTIF',
    enrolledCourses: counts?.inscriptions ?? Number(s.enrolledCourses ?? 0),
  };
}

function transformDashboardStudent(s: BackendRecord): DashboardStudent {
  const campus = s.campus as { campus_name?: string } | null;
  const program = s.program as { program_name?: string } | null;
  return {
    id: String(s.student_id ?? s.id ?? ''),
    name: s.first_name
      ? `${s.first_name} ${s.last_name}`.trim()
      : String(s.name ?? ''),
    email: String(s.email ?? ''),
    campus: campus?.campus_name ?? String(s.campus_id ?? s.campus ?? ''),
    filiere: program?.program_name ?? String(s.program_id ?? s.filiere ?? ''),
    promotion: String(s.enrollment_year ?? s.promotion ?? ''),
    paymentStatus: (s.payment_status ?? s.paymentStatus ?? 'PENDING') as InvoiceStatus,
    reminders: Number(s.reminders ?? 0),
  };
}

function transformRoom(r: BackendRecord): Room {
  const campus = r.campus as { campus_name?: string } | null;
  const counts = r.counts as { creneaux?: number } | null;
  const capacity = Number(r.capacity ?? 30);
  const slots = counts?.creneaux ?? 0;
  const occupancy = Math.min(slots / 20, 1);

  const VALID_TYPES = ['Amphi', 'Salle TD', 'Salle TP', 'Labo'] as const;
  const rawType = String(r.room_type ?? r.type ?? 'Salle TD');
  const type = (VALID_TYPES as readonly string[]).includes(rawType)
    ? (rawType as Room['type'])
    : 'Salle TD';

  return {
    id: String(r.room_id ?? r.id ?? ''),
    name: String(r.room_name ?? r.name ?? ''),
    campus: campus?.campus_name ?? String(r.campus_id ?? r.campus ?? ''),
    capacity,
    type,
    occupancy,
  };
}

/** Convertit un jour de la semaine (1=lun) + une DateTime epoch (HH:MM) en ISO complet */
function daySlotToISO(dayOfWeek: number, timeStr: string): string {
  const t = new Date(timeStr);
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const today = new Date();
  const todayMon = today.getDay() === 0 ? 7 : today.getDay();
  const diff = dayOfWeek - todayMon;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function transformScheduleRow(s: BackendRecord): ScheduleSlot {
  const course = s.course as BackendRecord | null;
  const instructor = s.instructor as BackendRecord | null;
  const room = s.room as BackendRecord | null;
  const dow = Number(s.day_of_week ?? 1);

  return {
    id: String(s.schedule_id ?? s.id ?? ''),
    courseId: String(course?.course_id ?? ''),
    courseName: String(course?.course_name ?? ''),
    instructorName: instructor
      ? `${instructor.first_name ?? ''} ${instructor.last_name ?? ''}`.trim()
      : '',
    roomId: String(room?.room_id ?? ''),
    roomName: String(room?.room_name ?? ''),
    campus: String(room?.campus_id ?? ''),
    startsAt: daySlotToISO(dow, String(s.start_time ?? '1970-01-01T09:00:00.000Z')),
    endsAt: daySlotToISO(dow, String(s.end_time ?? '1970-01-01T11:00:00.000Z')),
  };
}

function transformConflictRow(c: BackendRecord, idx: number): ScheduleConflict {
  const type = String(c.type ?? 'room') as 'room' | 'instructor';
  const slotA = transformScheduleRow((c.schedule_a as BackendRecord) ?? {});
  const slotB = transformScheduleRow((c.schedule_b as BackendRecord) ?? {});
  return {
    id: `conflict-${idx}`,
    severity: type === 'instructor' ? 'CRITICAL' : 'WARNING',
    reason: String(c.reason ?? 'Conflit détecté'),
    slots: [slotA, slotB],
    suggestedRooms: [],
  };
}

// ─── Fetch avec transformation ────────────────────────────────────────────────

export async function fetchAdminStudents(): Promise<AdminStudent[]> {
  try {
    const res = await fetch('/api/students', { credentials: 'include' });
    if (!res.ok) return MOCK_ADMIN_STUDENTS;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data.map((s) => transformStudent(s as BackendRecord));
    return MOCK_ADMIN_STUDENTS;
  } catch {
    return MOCK_ADMIN_STUDENTS;
  }
}

export async function fetchAdminStudent(id: string): Promise<AdminStudent | null> {
  try {
    const res = await fetch(`/api/students/${id}`, { credentials: 'include' });
    if (!res.ok) {
      const all = await fetchAdminStudents();
      return all.find((s) => s.id === id) ?? null;
    }
    const data: unknown = await res.json();
    if (data && typeof data === 'object') {
      return transformStudent(data as BackendRecord);
    }
    return null;
  } catch {
    const all = await fetchAdminStudents();
    return all.find((s) => s.id === id) ?? null;
  }
}

export async function fetchDashboardStudents(): Promise<DashboardStudent[]> {
  try {
    const res = await fetch('/api/students', { credentials: 'include' });
    if (!res.ok) return MOCK_DASHBOARD_STUDENTS;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data.map((s) => transformDashboardStudent(s as BackendRecord));
    return MOCK_DASHBOARD_STUDENTS;
  } catch {
    return MOCK_DASHBOARD_STUDENTS;
  }
}

export async function fetchRooms(): Promise<Room[]> {
  try {
    const res = await fetch('/api/rooms', { credentials: 'include' });
    if (!res.ok) return MOCK_ROOMS;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data.map((r) => transformRoom(r as BackendRecord));
    return MOCK_ROOMS;
  } catch {
    return MOCK_ROOMS;
  }
}

export async function fetchAdminSchedule(): Promise<ScheduleSlot[]> {
  try {
    const res = await fetch('/api/schedules', { credentials: 'include' });
    if (!res.ok) return MOCK_SCHEDULE;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data.map((s) => transformScheduleRow(s as BackendRecord));
    return MOCK_SCHEDULE;
  } catch {
    return MOCK_SCHEDULE;
  }
}

export async function fetchConflicts(): Promise<ScheduleConflict[]> {
  try {
    const res = await fetch('/api/schedules/conflicts', { credentials: 'include' });
    if (!res.ok) return MOCK_CONFLICTS;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data.map((c, i) => transformConflictRow(c as BackendRecord, i));
    return MOCK_CONFLICTS;
  } catch {
    return MOCK_CONFLICTS;
  }
}

export async function fetchSchedule(): Promise<ScheduleSlot[]> {
  return tryFetch('/api/schedules/me', MOCK_SCHEDULE);
}

export async function fetchInstructorSchedule(): Promise<ScheduleSlot[]> {
  return tryFetch('/api/schedules/instructor/me', MOCK_SCHEDULE);
}

export async function fetchGrades(): Promise<CourseGrade[]> {
  return tryFetch('/api/students/me/grades', MOCK_GRADES);
}

export async function fetchTranscript(): Promise<TranscriptEntry[]> {
  return tryFetch('/api/students/me/transcript', MOCK_TRANSCRIPT);
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return tryFetch('/api/payments/me', MOCK_INVOICES);
}

export async function fetchInvoice(id: string): Promise<Invoice | null> {
  const all = await fetchInvoices();
  return all.find((inv) => inv.id === id) ?? null;
}

export async function fetchTeacherCourses(): Promise<TeacherCourse[]> {
  return tryFetch('/api/courses/instructor/me', MOCK_TEACHER_COURSES);
}

export async function fetchTeacherCourse(id: string): Promise<TeacherCourse | null> {
  const all = await fetchTeacherCourses();
  return all.find((c) => c.id === id) ?? null;
}

export async function fetchTeacherHistory(): Promise<TeacherHistoryEntry[]> {
  return tryFetch('/api/courses/instructor/me/history', MOCK_TEACHER_HISTORY);
}

export async function fetchStudentHistory(): Promise<StudentHistory[]> {
  return tryFetch('/api/students/history/instructor/me', MOCK_STUDENT_HISTORY);
}

export async function fetchPayments(): Promise<PaymentRow[]> {
  return tryFetch('/api/payments', MOCK_PAYMENTS);
}

export async function fetchPaymentAlerts(): Promise<PaymentAlert[]> {
  return tryFetch('/api/payments/alerts', MOCK_PAYMENT_ALERTS);
}

export async function fetchNotifications(role: UserRole): Promise<AppNotification[]> {
  return tryFetch('/api/notifications/me', MOCK_NOTIFICATIONS[role]);
}

/** Charge les campus disponibles depuis le backend */
export async function fetchCampuses(): Promise<{ id: string; name: string }[]> {
  try {
    const res = await fetch('/api/campus', { credentials: 'include' });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
      return data.map((c: BackendRecord) => ({
        id: String(c.campus_id ?? c.id ?? ''),
        name: String(c.campus_name ?? c.name ?? ''),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

/** Charge les programmes d'un campus */
export async function fetchPrograms(campusId?: string): Promise<{ id: string; name: string }[]> {
  try {
    const url = campusId ? `/api/programs?campusId=${campusId}` : '/api/programs';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
      return data.map((p: BackendRecord) => ({
        id: String(p.program_id ?? p.id ?? ''),
        name: String(p.program_name ?? p.name ?? ''),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function triggerReminder(invoiceId: string): Promise<{ ok: true }> {
  try {
    const res = await fetch(`/api/notifications/reminders/${invoiceId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) return { ok: true };
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true };
}

export async function saveTeacherCourse(
  payload: Omit<TeacherCourse, 'id' | 'enrolledCount' | 'successRate' | 'averageGrade'>,
  mode: 'create' | 'edit',
  id?: string,
): Promise<{ ok: true }> {
  try {
    const res = await fetch(mode === 'create' ? '/api/courses' : `/api/courses/${id}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true };
}

export async function assignCourseRoom(
  courseId: string,
  roomId: string,
  resources: string[],
): Promise<{ ok: true }> {
  try {
    const res = await fetch(`/api/courses/${courseId}/room`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ roomId, resources }),
    });
    if (res.ok) return { ok: true };
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true };
}

export async function fetchEnrolledStudents(_courseId: string): Promise<EnrolledStudent[]> {
  return tryFetch(`/api/enrollments/course/${_courseId}/students`, MOCK_ENROLLED_STUDENTS);
}

export async function saveCourseGrades(
  courseId: string,
  rows: { studentId: string; grade: number | null; attendanceRate: number }[],
): Promise<{ ok: true; saved: number }> {
  try {
    const res = await fetch(`/api/courses/${courseId}/grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rows }),
    });
    if (res.ok) return { ok: true, saved: rows.length };
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true, saved: rows.length };
}
