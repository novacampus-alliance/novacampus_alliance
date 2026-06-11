'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icons';
import { Avatar, Button, ButtonLink, Card, StatCard } from '@/components/ui';
import {
  assignCourseRoom,
  fetchEnrolledStudents,
  fetchRooms,
  fetchTeacherCourse,
} from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { EnrolledStudent, Room, TeacherCourse } from '@/lib/types';
import { TEACHING_RESOURCES } from '../course-form';

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
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      </AppShell>
    );
  }

  if (course === null) {
    return (
      <AppShell title="Cours">
        <p className="text-sm text-gray-600">Cours introuvable.</p>
        <Link
          href="/enseignant/cours"
          className="mt-3 inline-block text-sm text-amber-900 underline underline-offset-2"
        >
          ← Mes cours
        </Link>
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
        <div className="flex flex-wrap gap-2">
          <ButtonLink variant="secondary" href={`/enseignant/cours/${course.id}/modifier`}>
            Modifier le cours
          </ButtonLink>
          <ButtonLink href={`/enseignant/cours/${course.id}/notes`}>
            <Icon name="notes" className="h-4 w-4" /> Saisir notes & présence
          </ButtonLink>
        </div>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Inscrits" value={String(course.enrolledCount)} />
        <StatCard
          label="Taux de réussite"
          value={formatPercent(course.successRate)}
          tone="success"
        />
        <StatCard label="Moyenne du cours" value={course.averageGrade.toFixed(2)} />
      </section>

      <RoomResourcesPanel course={course} />

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Étudiants inscrits</h3>
        {students === null ? (
          <p className="py-4 text-sm text-gray-500">Chargement…</p>
        ) : students.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">Aucun étudiant inscrit.</p>
        ) : (
          <Card className="overflow-x-auto">
            <table aria-label="Étudiants inscrits au cours" className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Étudiant</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Note</th>
                  <th scope="col" className="px-4 py-3">Présence</th>
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

function RoomResourcesPanel({ course }: { course: TeacherCourse }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState(course.roomId ?? '');
  const [resources, setResources] = useState<string[]>(course.resources ?? []);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms().then(setRooms);
  }, []);

  const campusRooms = rooms.filter((r) => r.campus === course.campus);

  function toggleResource(label: string) {
    setResources((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  }

  async function handleSave() {
    setSaving(true);
    setConfirm(null);
    try {
      await assignCourseRoom(course.id, roomId, resources);
      const room = rooms.find((r) => r.id === roomId);
      setConfirm(
        room
          ? `Salle ${room.name} et ressources enregistrées.`
          : 'Ressources enregistrées (aucune salle attribuée).',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Salle et ressources pédagogiques">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        Salle & ressources pédagogiques
      </h3>
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-56">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
              Salle ({course.campus})
            </span>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
            >
              <option value="">Aucune salle attribuée</option>
              {campusRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.type} · cap. {r.capacity}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-600">
            Ressources affectées
          </legend>
          <div className="flex flex-wrap gap-2">
            {TEACHING_RESOURCES.map((r) => {
              const active = resources.includes(r);
              return (
                <label
                  key={r}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    active
                      ? 'border-amber-700 bg-brand-50 font-medium text-gray-900'
                      : 'border-gray-500 bg-white text-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleResource(r)}
                  />
                  <span>{r}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {confirm && (
          <p role="status" className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {confirm}
          </p>
        )}
      </Card>
    </section>
  );
}
