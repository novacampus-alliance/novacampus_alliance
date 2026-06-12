'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Avatar, Card, StatusPill } from '@/components/ui';
import { fetchStudentHistory, fetchTeacherHistory } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { StudentHistory, TeacherHistoryEntry } from '@/lib/types';

export default function TeacherHistoryPage() {
  const [sessions, setSessions] = useState<TeacherHistoryEntry[] | null>(null);
  const [students, setStudents] = useState<StudentHistory[] | null>(null);
  const [semester, setSemester] = useState('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchTeacherHistory().then(setSessions);
    fetchStudentHistory().then(setStudents);
  }, []);

  const semesters = useMemo(
    () =>
      sessions
        ? Array.from(new Set(sessions.map((s) => s.semester))).sort().reverse()
        : [],
    [sessions],
  );

  const filteredSessions = (sessions ?? []).filter(
    (s) => semester === 'ALL' || s.semester === semester,
  );

  const q = query.trim().toLowerCase();
  const filteredStudents = (students ?? []).filter(
    (s) =>
      q === '' ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q),
  );

  return (
    <AppShell
      title="Historique"
      subtitle="Classes & etudiants"
      actions={
        <select
          aria-label="Filtrer par semestre"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
        >
          <option value="ALL">Tous les semestres</option>
          {semesters.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      }
    >
      <section aria-label="Historique des classes">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Classes passees
        </h2>
        {!sessions ? (
          <p className="text-sm text-gray-600">Chargement...</p>
        ) : (
          <Card className="overflow-x-auto">
            <table aria-label="Historique des classes" className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Semestre</th>
                  <th scope="col" className="px-4 py-3">Cours</th>
                  <th scope="col" className="px-4 py-3">Groupe</th>
                  <th scope="col" className="px-4 py-3">Campus</th>
                  <th scope="col" className="px-4 py-3">Etudiants</th>
                  <th scope="col" className="px-4 py-3">Moyenne</th>
                  <th scope="col" className="px-4 py-3">Reussite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSessions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-gray-700">{s.semester}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-600">
                        {s.courseCode}
                      </div>
                      <div className="font-medium text-gray-900">
                        {s.courseName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.group}</td>
                    <td className="px-4 py-3 text-gray-600">{s.campus}</td>
                    <td className="px-4 py-3 text-gray-700">{s.studentsCount}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-gray-900">
                      {s.averageGrade.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        tone={
                          s.successRate >= 0.8
                            ? 'success'
                            : s.successRate >= 0.6
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {formatPercent(s.successRate)}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-sm text-gray-600">
                      Aucune classe pour ce semestre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section aria-label="Historique des etudiants" className="mt-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Historique etudiants
          </h2>
          <input
            type="search"
            aria-label="Rechercher un etudiant par nom ou email"
            placeholder="Rechercher un etudiant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-11 w-64 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
          />
        </div>
        {!students ? (
          <p className="text-sm text-gray-600">Chargement...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-gray-600">
            Aucun etudiant ne correspond a cette recherche.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredStudents.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="truncate text-xs text-gray-600">
                      {s.email}
                    </div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {s.courses.map((c, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-md bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="font-mono text-xs text-gray-600">
                          {c.courseCode}
                        </span>{' '}
                        <span className="text-gray-900">{c.courseName}</span>
                        <span className="ml-1 text-xs text-gray-600">
                          · {c.semester}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-700">
                        Note :{' '}
                        <strong className="tabular-nums">
                          {c.grade != null ? c.grade.toFixed(1) : '—'}
                        </strong>{' '}
                        · Presence {formatPercent(c.attendanceRate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
