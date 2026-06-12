'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, PaymentStatusPill, StatCard } from '@/components/ui';
import { fetchPayments, triggerReminder } from '@/lib/api';
import { formatDate, formatEUR } from '@/lib/format';
import type { InvoiceStatus, PaymentRow } from '@/lib/types';

type PeriodFilter = 'ALL' | 'THIS_MONTH' | 'NEXT_30D' | 'OVERDUE_ONLY';

const STATUS_FILTERS: { value: InvoiceStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous statuts' },
  { value: 'PAID', label: 'Payees' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'OVERDUE', label: 'En retard' },
];

const PERIOD_FILTERS: { value: PeriodFilter; label: string }[] = [
  { value: 'ALL', label: 'Toutes periodes' },
  { value: 'THIS_MONTH', label: 'Ce mois' },
  { value: 'NEXT_30D', label: 'Prochains 30j' },
  { value: 'OVERDUE_ONLY', label: 'Retards uniquement' },
];

function matchPeriod(filter: PeriodFilter, dueAt: string, status: InvoiceStatus): boolean {
  if (filter === 'ALL') return true;
  const due = new Date(dueAt);
  const now = new Date();
  if (filter === 'OVERDUE_ONLY') return status === 'OVERDUE';
  if (filter === 'THIS_MONTH') {
    return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
  }
  if (filter === 'NEXT_30D') {
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);
    return due >= now && due <= in30;
  }
  return true;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [campus, setCampus] = useState('ALL');
  const [status, setStatus] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments().then(setPayments);
  }, []);

  const campuses = useMemo(() => {
    const set = new Set<string>();
    (payments ?? []).forEach((p) => set.add(p.campus));
    return Array.from(set).sort();
  }, [payments]);

  const filtered = useMemo(() => {
    return (payments ?? []).filter(
      (p) =>
        (campus === 'ALL' || p.campus === campus) &&
        (status === 'ALL' || p.status === status) &&
        matchPeriod(period, p.dueAt, p.status),
    );
  }, [payments, campus, status, period]);

  const totals = useMemo(() => {
    const list = payments ?? [];
    return {
      total: list.reduce((s, p) => s + p.amount, 0),
      paid: list.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
      pending: list.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0),
      overdue: list.filter((p) => p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0),
      remindersSent: list.reduce((s, p) => s + p.remindersSent, 0),
    };
  }, [payments]);

  const upcoming = useMemo(() => {
    const list = payments ?? [];
    const now = new Date();
    const in14 = new Date();
    in14.setDate(now.getDate() + 14);
    return list
      .filter((p) => p.status !== 'PAID')
      .filter((p) => {
        const d = new Date(p.dueAt);
        return d >= now && d <= in14;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [payments]);

  async function sendReminder(p: PaymentRow) {
    setBusyId(p.invoiceId);
    setConfirm(null);
    try {
      await triggerReminder(p.invoiceId);
      setPayments((prev) =>
        (prev ?? []).map((row) =>
          row.invoiceId === p.invoiceId
            ? { ...row, remindersSent: row.remindersSent + 1 }
            : row,
        ),
      );
      setConfirm(`Relance envoyee a ${p.studentName} (${p.reference}).`);
    } finally {
      setBusyId(null);
      setTimeout(() => setConfirm(null), 3500);
    }
  }

  return (
    <AppShell
      title="Paiements et relances"
      subtitle="Tableau de bord financier"
    >
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Encours total" value={formatEUR(totals.total)} />
        <StatCard label="Encaisse" value={formatEUR(totals.paid)} tone="success" />
        <StatCard label="En attente" value={formatEUR(totals.pending)} tone="warning" />
        <StatCard label="En retard" value={formatEUR(totals.overdue)} tone="danger" />
      </section>

      <Card className="mb-6 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Prochaines echeances (14 jours)
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-600">
            Aucune echeance dans les 14 prochains jours.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((p) => (
              <li
                key={p.invoiceId}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>
                  <strong>{p.studentName}</strong> — {p.reference} ·{' '}
                  {formatEUR(p.amount)}
                </span>
                <span className="text-xs text-gray-600">
                  Echeance {formatDate(p.dueAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <select
          aria-label="Filtrer par campus"
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          <option value="ALL">Tous les campus</option>
          {campuses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus | 'ALL')}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par periode"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          {PERIOD_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {confirm && (
        <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {confirm}
        </p>
      )}

      {!payments ? (
        <p className="text-sm text-gray-600">Chargement...</p>
      ) : (
        <Card className="overflow-x-auto">
          <table aria-label="Factures et relances" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Reference</th>
                <th scope="col" className="px-4 py-3">Etudiant</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3 text-right">Montant</th>
                <th scope="col" className="px-4 py-3">Echeance</th>
                <th scope="col" className="px-4 py-3">Statut</th>
                <th scope="col" className="px-4 py-3">Relances</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.invoiceId} className={p.status === 'OVERDUE' ? 'bg-amber-50/40' : undefined}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {p.reference}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.studentName}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.campus}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatEUR(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(p.dueAt)}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.remindersSent}</td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'PAID' ? (
                      <span className="text-xs text-gray-600">—</span>
                    ) : (
                      <button
                        onClick={() => sendReminder(p)}
                        aria-label={`Relancer ${p.studentName}`}
                        disabled={busyId === p.invoiceId}
                        className="rounded-md border border-gray-500 px-2 py-1.5 text-xs font-semibold hover:border-amber-700 hover:bg-brand-50 disabled:opacity-50"
                      >
                        {busyId === p.invoiceId ? 'Envoi...' : 'Relancer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-600">
                    Aucun resultat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </AppShell>
  );
}
