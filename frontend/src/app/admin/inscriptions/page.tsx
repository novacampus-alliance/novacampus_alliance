'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Avatar, Card, FiliereBadge, StatCard, StatusPill } from '@/components/ui';
import { fetchAdminStudents } from '@/lib/api';
import type { AdminStudent } from '@/lib/types';

export default function AdminEnrollmentsPage() {
  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [program, setProgram] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAdminStudents().then(setStudents);
  }, []);

  const programs = useMemo(
    () => Array.from(new Set((students ?? []).map((s) => s.program))).sort(),
    [students],
  );

  const filtered = (students ?? []).filter(
    (s) =>
      (program === 'ALL' || s.program === program) &&
      (statusFilter === 'ALL' || s.status === statusFilter),
  );

  const totalEnrollments = (students ?? []).reduce((s, x) => s + x.enrolledCourses, 0);
  const withoutCourses = (students ?? []).filter(
    (s) => s.enrolledCourses === 0 && s.status === 'ACTIF',
  ).length;

  return (
    <AppShell
      title="Inscriptions"
      subtitle="Programmes & cours"
      actions={
        <div className="flex items-center gap-2">
          <select
            aria-label="Filtrer par programme"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="ALL">Tous les programmes</option>
            {programs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            aria-label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="ALL">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="DIPLOME">Diplômé</option>
          </select>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Étudiants" value={String((students ?? []).length)} />
        <StatCard label="Inscriptions cours" value={String(totalEnrollments)} />
        <StatCard
          label="Actifs sans cours"
          value={String(withoutCourses)}
          tone={withoutCourses > 0 ? 'warning' : 'success'}
        />
      </div>

      {students === null ? (
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      ) : (
        <Card className="overflow-x-auto">
          <table aria-label="Inscriptions des étudiants" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Étudiant</th>
                <th scope="col" className="px-4 py-3">Programme</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3">Cours inscrits</th>
                <th scope="col" className="px-4 py-3">Statut</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${s.firstName} ${s.lastName}`} />
                      <span className="font-semibold text-gray-900">
                        {s.lastName.toUpperCase()} {s.firstName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <FiliereBadge label={s.program} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.campus}</td>
                  <td className="px-4 py-3">
                    {s.enrolledCourses === 0 ? (
                      <StatusPill tone="warning">Aucun cours</StatusPill>
                    ) : (
                      <span className="text-gray-700">{s.enrolledCourses} cours</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        s.status === 'ACTIF'
                          ? 'success'
                          : s.status === 'DIPLOME'
                            ? 'info'
                            : 'neutral'
                      }
                    >
                      {s.status === 'ACTIF' ? 'Actif' : s.status === 'DIPLOME' ? 'Diplômé' : 'Inactif'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/etudiants/${s.id}`}
                      className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    >
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun résultat.
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
