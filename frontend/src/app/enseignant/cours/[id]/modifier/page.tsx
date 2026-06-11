'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';
import { fetchTeacherCourse } from '@/lib/api';
import type { TeacherCourse } from '@/lib/types';
import { CourseForm } from '../../course-form';

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [course, setCourse] = useState<TeacherCourse | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchTeacherCourse(id).then(setCourse);
  }, [id]);

  if (course === undefined) {
    return (
      <AppShell title="Modifier le cours" subtitle="Mes cours">
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      </AppShell>
    );
  }

  if (course === null) {
    return (
      <AppShell title="Modifier le cours" subtitle="Mes cours">
        <p className="text-sm text-gray-600">Cours introuvable.</p>
        <Link
          href="/enseignant/cours"
          className="mt-3 inline-block text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Mes cours
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Modifier — ${course.code}`} subtitle={course.name}>
      <div className="mb-4">
        <Link
          href={`/enseignant/cours/${course.id}`}
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Retour au cours
        </Link>
      </div>
      <Card className="p-6">
        <CourseForm mode="edit" initial={course} />
      </Card>
    </AppShell>
  );
}
