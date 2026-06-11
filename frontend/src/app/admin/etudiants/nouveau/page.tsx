import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';
import { StudentForm } from '../student-form';

export default function NewStudentPage() {
  return (
    <AppShell title="Nouvel étudiant" subtitle="Créer une fiche">
      <div className="mb-4">
        <Link
          href="/admin/etudiants"
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Annuaire
        </Link>
      </div>
      <Card className="p-6">
        <StudentForm mode="create" />
      </Card>
    </AppShell>
  );
}
