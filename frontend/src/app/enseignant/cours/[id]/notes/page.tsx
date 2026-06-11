'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Avatar, Button, ButtonLink, Card } from '@/components/ui';
import {
  fetchEnrolledStudents,
  fetchTeacherCourse,
  saveCourseGrades,
} from '@/lib/api';
import type { EnrolledStudent, TeacherCourse } from '@/lib/types';

type RowState = {
  studentId: string;
  grade: string;
  attendance: string;
};

export default function TeacherGradesEntryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [course, setCourse] = useState<TeacherCourse | null | undefined>(undefined);
  const [students, setStudents] = useState<EnrolledStudent[] | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchTeacherCourse(id).then(setCourse);
    fetchEnrolledStudents(id).then((list) => {
      setStudents(list);
      setRows(
        list.map((s) => ({
          studentId: s.id,
          grade: s.currentGrade != null ? String(s.currentGrade) : '',
          attendance: String(Math.round(s.attendanceRate * 100)),
        })),
      );
    });
  }, [id]);

  function updateRow(studentId: string, key: 'grade' | 'attendance', value: string) {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, [key]: value } : r)),
    );
    setConfirm(null);
  }

  async function handleSave() {
    if (!id) return;
    setError(null);

    const parsed: { studentId: string; grade: number | null; attendanceRate: number }[] = [];
    for (const r of rows) {
      const gradeNum = r.grade.trim() === '' ? null : Number(r.grade);
      const attendanceNum = Number(r.attendance);
      if (gradeNum != null && (Number.isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20)) {
        setError(`Note invalide (attendu : 0 à 20)`);
        return;
      }
      if (Number.isNaN(attendanceNum) || attendanceNum < 0 || attendanceNum > 100) {
        setError(`Taux de présence invalide (attendu : 0 à 100)`);
        return;
      }
      parsed.push({
        studentId: r.studentId,
        grade: gradeNum,
        attendanceRate: attendanceNum / 100,
      });
    }

    setSaving(true);
    try {
      const res = await saveCourseGrades(id, parsed);
      setConfirm(`Saisie enregistrée pour ${res.saved} étudiant(s).`);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  if (course === undefined) {
    return (
      <AppShell title="Saisie notes">
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      </AppShell>
    );
  }

  if (course === null) {
    return (
      <AppShell title="Saisie notes">
        <p className="text-sm text-gray-600">Cours introuvable.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Notes — ${course.name}`} subtitle="Saisie notes & présences">
      <div className="mb-4">
        <Link
          href={`/enseignant/cours/${course.id}`}
          className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          ← Retour au cours
        </Link>
        <p className="mt-2 text-sm text-gray-600">
          Renseignez la note finale (sur 20) et le taux de présence (%) de chaque étudiant.
        </p>
      </div>

      {students === null ? (
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      ) : students.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Aucun étudiant inscrit.</p>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table aria-label="Saisie des notes et présences" className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Étudiant</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="w-32 px-4 py-3">Note /20</th>
                  <th scope="col" className="w-32 px-4 py-3">Présence %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const row = rows.find((r) => r.studentId === s.id);
                  return (
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
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          aria-label={`Note de ${s.firstName} ${s.lastName} sur 20`}
                          value={row?.grade ?? ''}
                          onChange={(e) => updateRow(s.id, 'grade', e.target.value)}
                          className="w-24 min-h-9 rounded-md border border-gray-500 px-2 py-1.5 text-sm focus:border-amber-700"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          aria-label={`Taux de présence de ${s.firstName} ${s.lastName} en pourcentage`}
                          value={row?.attendance ?? ''}
                          onChange={(e) => updateRow(s.id, 'attendance', e.target.value)}
                          className="w-24 min-h-9 rounded-md border border-gray-500 px-2 py-1.5 text-sm focus:border-amber-700"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {error && (
            <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {confirm && (
            <p role="status" className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {confirm}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <ButtonLink variant="secondary" href={`/enseignant/cours/${course.id}`}>
              Annuler
            </ButtonLink>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : '💾 Enregistrer'}
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
