'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card, StatCard, StatusPill } from '@/components/ui';
import { fetchGrades, fetchInvoices, fetchSchedule } from '@/lib/api';
import { formatEUR, formatTime } from '@/lib/format';
import type { CourseGrade, Invoice, ScheduleSlot } from '@/lib/types';

export default function EtudiantDashboardPage() {
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  useEffect(() => {
    fetchGrades().then(setGrades);
    fetchInvoices().then(setInvoices);
    fetchSchedule().then(setSchedule);
  }, []);

  const graded = grades.filter((g) => g.finalGrade != null);
  const average =
    graded.length > 0
      ? (graded.reduce((s, g) => s + (g.finalGrade ?? 0), 0) / graded.length).toFixed(1)
      : '—';
  const ects = grades.filter((g) => g.status === 'VALIDE').reduce((s, g) => s + g.ects, 0);
  const unpaid = invoices.filter((i) => i.status !== 'PAID');

  const now = new Date();
  const upcoming = [...schedule]
    .filter((s) => new Date(s.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 4);

  return (
    <AppShell title="Tableau de bord" subtitle="Espace étudiant">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Moyenne générale" value={average} />
        <StatCard label="ECTS validés" value={String(ects)} tone="success" />
        <StatCard
          label="Factures à régler"
          value={String(unpaid.length)}
          tone={unpaid.length ? 'warning' : 'success'}
        />
        <StatCard label="Cours cette semaine" value={String(schedule.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Prochains cours</h3>
            <Link
              href="/etudiant/planning"
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              Tout voir
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">Aucun cours à venir.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.courseName}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(s.startsAt).toLocaleDateString('fr-FR', { weekday: 'short' })}{' '}
                      {formatTime(s.startsAt)} · Salle {s.roomName}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{s.instructorName}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Mes factures</h3>
            <Link
              href="/etudiant/factures"
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              Tout voir
            </Link>
          </div>
          {invoices.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">Aucune facture.</p>
          ) : (
            <ul className="space-y-2">
              {invoices.slice(0, 4).map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{i.description}</div>
                    <div className="text-xs text-gray-600">{formatEUR(i.amount)}</div>
                  </div>
                  <StatusPill
                    tone={
                      i.status === 'PAID'
                        ? 'success'
                        : i.status === 'PENDING'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {i.status === 'PAID' ? 'Payée' : i.status === 'PENDING' ? 'En attente' : 'En retard'}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
