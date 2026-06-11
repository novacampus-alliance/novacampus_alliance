import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';
import { CourseForm } from '../course-form';

export default function NewCoursePage() {
  return (
    <AppShell title="Nouveau cours" subtitle="Créer un cours">
      <div className="mb-4">
        <Link
          href="/enseignant/cours"
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Mes cours
        </Link>
      </div>
      <Card className="p-6">
        <CourseForm mode="create" />
      </Card>
    </AppShell>
  );
}
