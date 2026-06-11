/**
 * Petit client HTTP pour les pages.
 *
 * Strategie : on tape l'API gateway si elle repond, sinon on retombe sur des
 * mocks locaux pour que les pages restent demonstrables tant que le backend
 * n'est pas branche. Les types respectent les contrats reels.
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

async function tryFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchSchedule(): Promise<ScheduleSlot[]> {
  return tryFetch('/api/schedules/me', MOCK_SCHEDULE);
}

export async function fetchInstructorSchedule(): Promise<ScheduleSlot[]> {
  return tryFetch('/api/schedules/instructor/me', MOCK_SCHEDULE);
}

export async function fetchAdminSchedule(): Promise<ScheduleSlot[]> {
  return tryFetch('/api/schedules', MOCK_SCHEDULE);
}

export async function fetchConflicts(): Promise<ScheduleConflict[]> {
  return tryFetch('/api/schedules/conflicts', MOCK_CONFLICTS);
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

export async function fetchRooms(): Promise<Room[]> {
  return tryFetch('/api/rooms', MOCK_ROOMS);
}

export async function fetchTeacherHistory(): Promise<TeacherHistoryEntry[]> {
  return tryFetch('/api/courses/instructor/me/history', MOCK_TEACHER_HISTORY);
}

export async function fetchStudentHistory(): Promise<StudentHistory[]> {
  return tryFetch('/api/students/history/instructor/me', MOCK_STUDENT_HISTORY);
}

/**
 * Creation/edition d'un cours par l'enseignant. POST/PATCH si l'API repond,
 * succes simule sinon (meme convention que saveCourseGrades).
 */
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

/** Affecte une salle et des ressources pedagogiques a un cours. */
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

export async function fetchAdminStudents(): Promise<AdminStudent[]> {
  return tryFetch('/api/students', MOCK_ADMIN_STUDENTS);
}

export async function fetchAdminStudent(id: string): Promise<AdminStudent | null> {
  const all = await fetchAdminStudents();
  return all.find((s) => s.id === id) ?? null;
}

export async function fetchPayments(): Promise<PaymentRow[]> {
  return tryFetch('/api/payments', MOCK_PAYMENTS);
}

export async function fetchDashboardStudents(): Promise<DashboardStudent[]> {
  return tryFetch('/api/students/overview', MOCK_DASHBOARD_STUDENTS);
}

export async function fetchPaymentAlerts(): Promise<PaymentAlert[]> {
  return tryFetch('/api/payments/alerts', MOCK_PAYMENT_ALERTS);
}

export async function fetchNotifications(role: UserRole): Promise<AppNotification[]> {
  return tryFetch('/api/notifications/me', MOCK_NOTIFICATIONS[role]);
}

/**
 * Declenche une relance manuelle (POST). On tente l'endpoint, sinon on simule
 * un succes apres un court delai.
 */
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

/**
 * Sauvegarde des notes/presences d'un cours. POST si l'API repond, simulee
 * sinon. La signature retourne le nombre d'eleves enregistres pour l'UI.
 */
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
