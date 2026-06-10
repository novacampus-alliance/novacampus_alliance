/**
 * Types partagés cote frontend.
 * Ces interfaces refletent les contrats des services backend (academic, billing, etc.).
 */

export type CourseStatus = 'VALIDE' | 'EN_COURS' | 'ECHEC' | 'RATTRAPAGE';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export type ConflictSeverity = 'CRITICAL' | 'WARNING';

export interface ScheduleSlot {
  id: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  roomId: string;
  roomName: string;
  campus: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  studentGroup?: string;
  /** Marqueur eleve cote backend : "TRUE" quand la salle a change depuis le dernier polling */
  roomChanged?: boolean;
}

export interface CourseGrade {
  courseId: string;
  courseCode: string;
  courseName: string;
  finalGrade: number | null;
  maxGrade: number;
  attendanceRate: number; // 0..1
  status: CourseStatus;
  ects: number;
  semester: string;
}

export interface TranscriptEntry {
  semester: string;
  courses: CourseGrade[];
  averageGrade: number;
  ectsEarned: number;
}

export interface Invoice {
  id: string;
  reference: string;
  studentId: string;
  studentName?: string;
  amount: number; // EUR
  currency: 'EUR';
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  description: string;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface EnrolledStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentGrade: number | null;
  attendanceRate: number;
}

export interface TeacherCourse {
  id: string;
  code: string;
  name: string;
  campus: string;
  program: string;
  enrolledCount: number;
  successRate: number;
  averageGrade: number;
}

export interface AdminStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  campus: string;
  program: string;
  status: 'ACTIF' | 'INACTIF' | 'DIPLOME';
  enrolledCourses: number;
}

export interface ScheduleConflict {
  id: string;
  severity: ConflictSeverity;
  reason: string;
  slots: ScheduleSlot[];
  suggestedRooms: { roomId: string; roomName: string; capacity: number }[];
}

export interface PaymentRow {
  invoiceId: string;
  reference: string;
  studentName: string;
  studentId: string;
  campus: string;
  amount: number;
  status: InvoiceStatus;
  dueAt: string;
  remindersSent: number;
}

/** Ligne du tableau de bord administration (vue synthetique). */
export interface DashboardStudent {
  id: string;
  name: string;
  email: string;
  campus: string;
  filiere: string;
  promotion: string;
  paymentStatus: InvoiceStatus;
  /** Nombre de relances deja envoyees (affiche "Retard x2" si > 1). */
  reminders: number;
}

/** Carte d'alerte de paiement du rail de droite. */
export interface PaymentAlert {
  id: string;
  studentName: string;
  amount: number;
  detail: string;
  reminderLevel: number;
}
