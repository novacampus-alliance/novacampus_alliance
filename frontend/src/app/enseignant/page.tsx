'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card, FiliereBadge, StatCard } from '@/components/ui';
import { fetchInstructorSchedule, fetchTeacherCourses } from '@/lib/api';
import { formatPercent, formatTime } from '@/lib/format';
import type { ScheduleSlot, TeacherCourse } from '@/lib/types';

export default function EnseignantDashboardPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  useEffect(() => {
    fetchTeacherCourses().then(setCourses);
    fetchInstructorSchedule().then(setSchedule);
  }, []);

  const totalStudents = courses.reduce((s, c) => s + c.enrolledCount, 0);
  const avgSuccess =
    courses.length > 0
      ? courses.reduce((s, c) => s + c.successRate, 0) / courses.length
      : 0;

  const now = new Date();
  const upcoming = [...schedule]
    .filter((s) => new Date(s.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 4);

  return (
    <AppShell title="Tableau de bord" subtitle="Espace enseignant">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cours animés" value={String(courses.length)} />
        <StatCard label="Étudiants" value={String(totalStudents)} />
        <StatCard
          label="Taux de réussite moyen"
          value={formatPercent(avgSuccess)}
          tone="success"
        />
        <StatCard label="Cours cette semaine" value={String(schedule.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Mes cours</h3>
            <Link
              href="/enseignant/cours"
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              Tout voir
            </Link>
          </div>
          {courses.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">Aucun cours attribué.</p>
          ) : (
            <ul className="space-y-2">
              {courses.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/enseignant/cours/${c.id}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-600">
                        {c.enrolledCount} inscrit(s) · moyenne {c.averageGrade.toFixed(1)}
                      </div>
                    </div>
                    <FiliereBadge label={c.program} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Prochains cours</h3>
            <Link
              href="/enseignant/planning"
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              Planning
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">Aucun cours à venir cette semaine.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.courseName}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(s.startsAt).toLocaleDateString('fr-FR', { weekday: 'short' })}{' '}
                      {formatTime(s.startsAt)} · Salle {s.roomName}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
