'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Avatar, Button, ButtonLink, Card, FiliereBadge, StatusPill } from '@/components/ui';
import { fetchAdminStudents } from '@/lib/api';
import type { AdminStudent } from '@/lib/types';

function toCSV(rows: AdminStudent[]): string {
  const headers = [
    'id',
    'firstName',
    'lastName',
    'email',
    'campus',
    'program',
    'status',
    'enrolledCourses',
  ];
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => esc((r as unknown as Record<string, string | number>)[h])).join(','),
    ),
  ];
  return lines.join('\n');
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [search, setSearch] = useState('');
  const [campus, setCampus] = useState<string>('ALL');
  const [program, setProgram] = useState<string>('ALL');

  useEffect(() => {
    fetchAdminStudents().then(setStudents);
  }, []);

  const filterOptions = useMemo(() => {
    const campuses = new Set<string>();
    const programs = new Set<string>();
    (students ?? []).forEach((s) => {
      campuses.add(s.campus);
      programs.add(s.program);
    });
    return {
      campuses: Array.from(campuses).sort(),
      programs: Array.from(programs).sort(),
    };
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students ?? []).filter((s) => {
      if (campus !== 'ALL' && s.campus !== campus) return false;
      if (program !== 'ALL' && s.program !== program) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [students, search, campus, program]);

  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etudiants_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="Etudiants"
      subtitle="Annuaire et inscriptions"
      actions={
        <>
          <Button variant="secondary" onClick={exportCSV}>
            ⬇ Exporter CSV
          </Button>
          <ButtonLink href="/admin/etudiants/nouveau">
            + Nouvel etudiant
          </ButtonLink>
        </>
      }
    >
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <input
          type="search"
          aria-label="Rechercher par nom ou email"
          placeholder="Rechercher par nom ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        />
        <select
          aria-label="Filtrer par campus"
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          <option value="ALL">Tous les campus</option>
          {filterOptions.campuses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par programme"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          <option value="ALL">Tous les programmes</option>
          {filterOptions.programs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {!students ? (
        <p className="text-sm text-gray-600">Chargement...</p>
      ) : (
        <Card className="overflow-x-auto">
          <table aria-label="Annuaire des etudiants" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Etudiant</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3">Programme</th>
                <th scope="col" className="px-4 py-3">Cours</th>
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
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">
                          {s.lastName.toUpperCase()} {s.firstName}
                        </div>
                        <div className="truncate text-xs text-gray-600">
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.campus}</td>
                  <td className="px-4 py-3">
                    <FiliereBadge label={s.program} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {s.enrolledCourses}
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
                      {s.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/etudiants/${s.id}`}
                      className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    >
                      Editer
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-600">
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
