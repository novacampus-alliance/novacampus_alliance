import { CourseStatus, InvoiceStatus } from './types';

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID: 'Payee',
  PENDING: 'En attente',
  OVERDUE: 'En retard',
};

// Teintes *-900 sur fonds *-50 : contraste >= 7:1 (WCAG AAA).
export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  PAID: 'bg-emerald-50 text-emerald-900 ring-emerald-700/40',
  PENDING: 'bg-amber-50 text-amber-900 ring-amber-700/40',
  OVERDUE: 'bg-red-50 text-red-900 ring-red-700/40',
};

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  VALIDE: 'Valide',
  EN_COURS: 'En cours',
  ECHEC: 'Echec',
  RATTRAPAGE: 'Rattrapage',
};

export const COURSE_STATUS_BADGE: Record<CourseStatus, string> = {
  VALIDE: 'bg-emerald-50 text-emerald-900 ring-emerald-700/40',
  EN_COURS: 'bg-sky-50 text-sky-900 ring-sky-700/40',
  ECHEC: 'bg-red-50 text-red-900 ring-red-700/40',
  RATTRAPAGE: 'bg-amber-50 text-amber-900 ring-amber-700/40',
};
