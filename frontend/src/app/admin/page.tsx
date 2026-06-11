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
    setToast(`Relance envoyée à ${s.name}.`);
    setTimeout(() => setToast(null), 3000);
  }

  function sendAll() {
    setSentAll(true);
    setToast(`${alerts.length} relances envoyées.`);
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
          {sentAll ? 'Relances envoyées' : 'Envoyer toutes les relances'}
        </Button>
      </Card>

      <Card dark className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          <span className="text-sm font-semibold text-brand-400">
            Agent IA — Conflits EDT
          </span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-300">
          Détection automatique des conflits de salle et d&apos;enseignant.
          L&apos;agent M7 propose des suggestions de résolution basées sur
          les disponibilités en temps réel.
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/admin/conflits"
            className="rounded-md border border-zinc-500 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800"
          >
            Voir les conflits
          </Link>
          <Link
            href="/admin/plannings"
            className="rounded-md border border-zinc-500 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800"
          >
            Planning global
          </Link>
        </div>
      </Card>
    </>
  );

  return (
    <AppShell
      title="Administration"
      subtitle="Gestion des étudiants et paiements"
      aside={aside}
    >
      {overdueCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-amber-900">
          <span aria-hidden>⚠️</span>
          <span>
            <strong>{overdueCount} paiements en retard</strong> nécessitent une
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Rechercher un étudiant"
          placeholder="Rechercher un étudiant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        />
        <select
          aria-label="Filtrer par campus"
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
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
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
        >
          <option value="ALL">Tous statuts</option>
          <option value="PAID">À jour</option>
          <option value="OVERDUE">En retard</option>
        </select>
        <ButtonLink href="/admin/etudiants/nouveau">+ Inscrire</ButtonLink>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table aria-label="Liste des étudiants" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Étudiant</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3">Filière</th>
                <th scope="col" className="px-4 py-3">Promotion</th>
                <th scope="col" className="px-4 py-3">Paiement</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Chargement…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-3 text-xs text-gray-600">
        {(students ?? []).length} étudiant(s) ·{' '}
        <span className="font-semibold text-amber-900">
          {overdueCount} en retard
        </span>
      </p>
    </AppShell>
  );
}
