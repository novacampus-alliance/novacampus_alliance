'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';
import { fetchGrades } from '@/lib/api';
import {
  COURSE_STATUS_BADGE,
  COURSE_STATUS_LABEL,
  formatPercent,
} from '@/lib/format';
import type { CourseGrade } from '@/lib/types';

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<CourseGrade[] | null>(null);

  useEffect(() => {
    fetchGrades().then(setGrades);
  }, []);

  return (
    <AppShell title="Notes" subtitle="Notes du semestre">
      <p className="mb-4 text-sm text-gray-600">
        Tableau détaillé par cours : note finale, taux de présence et statut.
      </p>

      {grades === null ? (
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      ) : grades.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Aucune note disponible.</p>
      ) : (
        <Card className="overflow-x-auto">
          <table aria-label="Notes du semestre par cours" className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Code</th>
                <th scope="col" className="px-4 py-3">Cours</th>
                <th scope="col" className="px-4 py-3">ECTS</th>
                <th scope="col" className="px-4 py-3">Note finale</th>
                <th scope="col" className="px-4 py-3">Présence</th>
                <th scope="col" className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map((g) => (
                <tr key={g.courseId}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{g.courseCode}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{g.courseName}</td>
                  <td className="px-4 py-3 text-gray-700">{g.ects}</td>
                  <td className="px-4 py-3">
                    {g.finalGrade != null ? (
                      <span className="font-semibold">
                        {g.finalGrade.toFixed(1)} / {g.maxGrade}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded bg-gray-100">
                        <div
                          className={`h-full ${
                            g.attendanceRate >= 0.9
                              ? 'bg-emerald-700'
                              : g.attendanceRate >= 0.75
                                ? 'bg-amber-700'
                                : 'bg-red-600'
                          }`}
                          style={{ width: `${g.attendanceRate * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatPercent(g.attendanceRate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${COURSE_STATUS_BADGE[g.status]}`}
                    >
                      {COURSE_STATUS_LABEL[g.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppShell>
  );
}
