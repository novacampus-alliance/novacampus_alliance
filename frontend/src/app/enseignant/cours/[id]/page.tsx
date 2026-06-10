'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Avatar, ButtonLink, Card, StatCard } from '@/components/ui';
import {
  fetchEnrolledStudents,
  fetchTeacherCourse,
} from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { EnrolledStudent, TeacherCourse } from '@/lib/types';

export default function TeacherCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [course, setCourse] = useState<TeacherCourse | null | undefined>(undefined);
  const [students, setStudents] = useState<EnrolledStudent[] | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchTeacherCourse(id).then(setCourse);
    fetchEnrolledStudents(id).then(setStudents);
  }, [id]);

  if (course === undefined) {
    return (
      <AppShell title="Cours">
        <p className="text-sm text-gray-600">Chargement...</p>
      </AppShell>
    );
  }

  if (course === null) {
    return (
      <AppShell title="Cours">
        <p className="text-sm text-gray-600">Cours introuvable.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${course.code} — ${course.name}`} subtitle={course.program}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/enseignant/cours"
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Mes cours
        </Link>
        <ButtonLink href={`/enseignant/cours/${course.id}/notes`}>
          ✏️ Saisir notes & presence
        </ButtonLink>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Inscrits" value={String(course.enrolledCount)} />
        <StatCard
          label="Taux de reussite"
          value={formatPercent(course.successRate)}
          tone="success"
        />
        <StatCard label="Moyenne du cours" value={course.averageGrade.toFixed(2)} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Etudiants inscrits
        </h3>
        {!students ? (
          <p className="text-sm text-gray-600">Chargement...</p>
        ) : (
          <Card className="overflow-x-auto">
            <table aria-label="Etudiants inscrits au cours" className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Etudiant</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Note</th>
                  <th scope="col" className="px-4 py-3">Presence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                        <span className="font-medium text-gray-900">
                          {s.lastName.toUpperCase()} {s.firstName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.currentGrade != null ? s.currentGrade.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatPercent(s.attendanceRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </AppShell>
  );
}
