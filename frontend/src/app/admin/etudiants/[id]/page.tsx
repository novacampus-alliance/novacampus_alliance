'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';
import { fetchAdminStudent } from '@/lib/api';
import type { AdminStudent } from '@/lib/types';
import { StudentForm } from '../student-form';

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [student, setStudent] = useState<AdminStudent | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchAdminStudent(id).then(setStudent);
  }, [id]);

  if (student === undefined) {
    return (
      <AppShell title="Édition étudiant" subtitle="Étudiants">
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      </AppShell>
    );
  }

  if (student === null) {
    return (
      <AppShell title="Édition étudiant" subtitle="Étudiants">
        <p className="text-sm text-gray-600">Fiche introuvable.</p>
        <Link
          href="/admin/etudiants"
          className="mt-3 inline-block text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Retour
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${student.firstName} ${student.lastName}`}
      subtitle={`${student.campus} · ${student.program}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/etudiants"
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Annuaire
        </Link>
      </div>
      <Card className="p-6">
        <StudentForm mode="edit" initial={student} />
      </Card>
    </AppShell>
  );
}
