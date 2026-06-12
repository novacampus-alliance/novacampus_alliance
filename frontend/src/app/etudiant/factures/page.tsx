'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';
import { fetchInvoices } from '@/lib/api';
import {
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  formatDate,
  formatEUR,
} from '@/lib/format';
import type { Invoice, InvoiceStatus } from '@/lib/types';

const FILTERS: { value: InvoiceStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PAID', label: 'Payees' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'OVERDUE', label: 'En retard' },
];

export default function StudentInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchInvoices().then(setInvoices);
  }, []);

  const filtered = useMemo(
    () => (invoices ?? []).filter((i) => filter === 'ALL' || i.status === filter),
    [invoices, filter],
  );

  const totals = useMemo(() => {
    const list = invoices ?? [];
    return {
      paid: list.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
      pending: list
        .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
        .reduce((s, i) => s + i.amount, 0),
      overdue: list.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0),
    };
  }, [invoices]);

  return (
    <AppShell title="Factures" subtitle="Suivi de vos paiements">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Summary label="Payees" value={formatEUR(totals.paid)} tone="ok" />
        <Summary label="A regler" value={formatEUR(totals.pending)} tone="warn" />
        <Summary label="En retard" value={formatEUR(totals.overdue)} tone="bad" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f.value
                ? 'bg-brand-400 text-zinc-950 ring-1 ring-brand-700'
                : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!invoices ? (
        <p className="text-sm text-gray-600">Chargement...</p>
      ) : (
        <Card className="overflow-x-auto">
          <table aria-label="Liste des factures" className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Reference</th>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3">Emise le</th>
                <th scope="col" className="px-4 py-3">Echeance</th>
                <th scope="col" className="px-4 py-3 text-right">Montant</th>
                <th scope="col" className="px-4 py-3">Statut</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {inv.reference}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{inv.description}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.issuedAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.dueAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatEUR(inv.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${INVOICE_STATUS_BADGE[inv.status]}`}
                    >
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/etudiant/factures/${inv.id}`}
                      className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-600">
                    Aucune facture pour ce filtre.
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

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad';
}) {
  const border =
    tone === 'ok'
      ? 'border-emerald-200'
      : tone === 'warn'
        ? 'border-amber-200'
        : 'border-red-200';
  return (
    <div className={`rounded-lg border ${border} bg-white p-4`}>
      <div className="text-xs uppercase tracking-wide text-gray-600">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
