'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui';
import { fetchInvoice } from '@/lib/api';
import {
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  formatDate,
  formatEUR,
} from '@/lib/format';
import type { Invoice } from '@/lib/types';

export default function StudentInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchInvoice(id).then(setInvoice);
  }, [id]);

  if (invoice === undefined) {
    return (
      <AppShell title="Détail facture" subtitle="Factures">
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      </AppShell>
    );
  }

  if (invoice === null) {
    return (
      <AppShell title="Détail facture" subtitle="Factures">
        <p className="text-sm text-gray-600">Facture introuvable.</p>
        <Link
          href="/etudiant/factures"
          className="mt-3 inline-block text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Retour à la liste
        </Link>
      </AppShell>
    );
  }

  const total = invoice.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  return (
    <AppShell title={`Facture ${invoice.reference}`} subtitle="Factures">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/etudiant/factures"
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Retour
        </Link>
        <Button onClick={() => window.print()}>📄 Télécharger en PDF</Button>
      </div>

      <article className="rounded-lg border bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <header className="mb-4 flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold">Facture {invoice.reference}</h2>
            <p className="mt-1 text-sm text-gray-600">{invoice.description}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${INVOICE_STATUS_BADGE[invoice.status]}`}
          >
            {INVOICE_STATUS_LABEL[invoice.status]}
          </span>
        </header>

        <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
          <Field label="Émise le" value={formatDate(invoice.issuedAt)} />
          <Field label="Échéance" value={formatDate(invoice.dueAt)} />
          {invoice.paidAt && (
            <Field label="Payée le" value={formatDate(invoice.paidAt)} />
          )}
        </dl>

        <table aria-label="Lignes de la facture" className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
              <th scope="col" className="py-2">Libellé</th>
              <th scope="col" className="py-2">Qté</th>
              <th scope="col" className="py-2 text-right">P.U.</th>
              <th scope="col" className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.lines.map((l, i) => (
              <tr key={i}>
                <td className="py-2 text-gray-900">{l.label}</td>
                <td className="py-2 text-gray-700">{l.quantity}</td>
                <td className="py-2 text-right text-gray-700">{formatEUR(l.unitPrice)}</td>
                <td className="py-2 text-right font-medium">
                  {formatEUR(l.quantity * l.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="py-3 text-right text-sm font-medium">
                Total TTC
              </td>
              <td className="py-3 text-right text-lg font-semibold">
                {formatEUR(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-6 text-xs text-gray-600">
          Novacampus Alliance — Document généré pour usage interne.
        </p>
      </article>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-600">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
    </div>
  );
}
