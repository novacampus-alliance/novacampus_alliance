'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { ButtonLink } from '@/components/ui';
import { fetchTeacherCourses } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { TeacherCourse } from '@/lib/types';

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null);

  useEffect(() => {
    fetchTeacherCourses().then(setCourses);
  }, []);

  return (
    <AppShell
      title="Mes cours"
      subtitle="Cours attribues"
      actions={
        <ButtonLink href="/enseignant/cours/nouveau">+ Nouveau cours</ButtonLink>
      }
    >
      <p className="mb-4 text-sm text-gray-600">
        Cliquez sur un cours pour gerer les notes, la presence, la salle et les
        ressources.
      </p>

      {!courses ? (
        <p className="text-sm text-gray-600">Chargement...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/enseignant/cours/${c.id}`}
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-gray-600">{c.code}</div>
                  <div className="mt-0.5 font-medium text-gray-900">{c.name}</div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-800">
                  {c.campus}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Stat label="Inscrits" value={String(c.enrolledCount)} />
                <Stat
                  label="Reussite"
                  value={formatPercent(c.successRate)}
                />
                <Stat label="Moyenne" value={c.averageGrade.toFixed(1)} />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {c.roomName ? `Salle ${c.roomName}` : 'Salle non attribuee'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-2 py-1.5">
      <div className="text-[11px] uppercase tracking-wide text-gray-800">
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
