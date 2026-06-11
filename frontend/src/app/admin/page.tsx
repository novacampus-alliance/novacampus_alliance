'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import {
  Avatar,
  Button,
  ButtonLink,
  Card,
  FiliereBadge,
  PaymentStatusPill,
  StatusPill,
} from '@/components/ui';
import {
  fetchDashboardStudents,
  fetchPaymentAlerts,
  triggerReminder,
} from '@/lib/api';
import { formatEUR } from '@/lib/format';
import type { DashboardStudent, PaymentAlert } from '@/lib/types';

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<DashboardStudent[] | null>(null);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [search, setSearch] = useState('');
  const [campus, setCampus] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sentAll, setSentAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStudents().then(setStudents);
    fetchPaymentAlerts().then(setAlerts);
  }, []);

  const campuses = useMemo(() => {
    const set = new Set<string>();
    (students ?? []).forEach((s) => set.add(s.campus));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students ?? []).filter((s) => {
      if (campus !== 'ALL' && s.campus !== campus) return false;
      if (status === 'OVERDUE' && s.paymentStatus !== 'OVERDUE') return false;
      if (status === 'PAID' && s.paymentStatus !== 'PAID') return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    });
  }, [students, search, campus, status]);

  const overdueCount = (students ?? []).filter(
    (s) => s.paymentStatus === 'OVERDUE',
  ).length;

  async function sendOne(s: DashboardStudent) {
    await triggerReminder(s.id);
    setToast(`Relance envoyee a ${s.name}.`);
    setTimeout(() => setToast(null), 3000);
  }

  function sendAll() {
    setSentAll(true);
    setToast(`${alerts.length} relances envoyees.`);
    setTimeout(() => setToast(null), 3000);
  }

  const aside = (
    <>
      <Card className="p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
          Alertes paiement
        </div>
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {a.studentName}
                </div>
                <div className="text-xs text-gray-600">
                  {formatEUR(a.amount)} · {a.detail}
                </div>
              </div>
              <StatusPill tone={a.reminderLevel >= 2 ? 'danger' : 'warning'}>
                Relance {a.reminderLevel}
              </StatusPill>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          onClick={sendAll}
          disabled={sentAll}
        >
          {sentAll ? 'Relances envoyees' : 'Envoyer toutes les relances'}
        </Button>
      </Card>

      <Card dark className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          <span className="text-sm font-semibold text-brand-400">
            Agent IA — Relances
          </span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-300">
          {alerts.length} relances personnalisees pretes. Hugo Simon (45j de
          retard) → escalade vers contentieux recommandee.
        </p>
        <div className="mt-3 flex gap-2">
          <button className="rounded-md border border-zinc-500 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800">
            Voir les brouillons
          </button>
          <button className="rounded-md border border-zinc-500 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800">
            Tout approuver
          </button>
        </div>
      </Card>
    </>
  );

  return (
    <AppShell
      title="Administration"
      subtitle="Gestion des etudiants et paiements"
      aside={aside}
    >
      {/* Banniere de retard */}
      {overdueCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-amber-900">
          <span aria-hidden>⚠️</span>
          <span>
            <strong>{overdueCount} paiements en retard</strong> necessitent une
            relance —{' '}
            <Link href="/admin/paiements" className="font-semibold underline">
              Voir le rapport
            </Link>
          </span>
        </div>
      )}

      {toast && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      {/* Barre de recherche / filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Rechercher un etudiant"
          placeholder="Rechercher un etudiant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        />
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
          aria-label="Filtrer par statut de paiement"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          <option value="ALL">Tous statuts</option>
          <option value="PAID">A jour</option>
          <option value="OVERDUE">En retard</option>
        </select>
        <ButtonLink href="/admin/etudiants/nouveau">+ Inscrire</ButtonLink>
      </div>

      {/* Tableau */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table aria-label="Liste des etudiants" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Etudiant</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3">Filiere</th>
                <th scope="col" className="px-4 py-3">Promotion</th>
                <th scope="col" className="px-4 py-3">Paiement</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(filtered ?? []).map((s) => {
                const overdue = s.paymentStatus === 'OVERDUE';
                return (
                  <tr
                    key={s.id}
                    className={overdue ? 'bg-amber-50/40' : undefined}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900">
                            {s.name}
                          </div>
                          <div className="truncate text-xs text-gray-600">
                            {s.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.campus}</td>
                    <td className="px-4 py-3">
                      <FiliereBadge label={s.filiere} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.promotion}</td>
                    <td className="px-4 py-3">
                      {overdue && s.reminders > 1 ? (
                        <StatusPill tone="danger">
                          ⚠ Retard ×{s.reminders}
                        </StatusPill>
                      ) : (
                        <PaymentStatusPill status={s.paymentStatus} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {overdue ? (
                        <button
                          onClick={() => sendOne(s)}
                          aria-label={`Relance de paiement — ${s.name}`}
                          className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                        >
                          {s.reminders > 1 ? 'Escalader' : 'Relancer'}
                        </button>
                      ) : (
                        <Link
                          href={`/admin/etudiants/${s.id}`}
                          aria-label={`Ouvrir le dossier de ${s.name}`}
                          className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                        >
                          Dossier
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-3 text-xs text-gray-600">
        {(students ?? []).length} etudiants ·{' '}
        <span className="font-semibold text-amber-900">
          {overdueCount} en retard
        </span>
      </p>
    </AppShell>
  );
}
