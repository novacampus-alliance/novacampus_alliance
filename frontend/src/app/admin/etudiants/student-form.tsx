'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  createEnrollments,
  fetchCampuses,
  fetchCourses,
  fetchPrograms,
  saveAdminStudent,
} from '@/lib/api';
import type { AdminStudent } from '@/lib/types';

interface Props {
  initial?: AdminStudent;
  mode: 'create' | 'edit';
}

export function StudentForm({ initial, mode }: Props) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [campus, setCampus] = useState(initial?.campus ?? '');
  const [program, setProgram] = useState(initial?.program ?? '');
  const [status, setStatus] = useState<AdminStudent['status']>(initial?.status ?? 'ACTIF');
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampuses().then((data) => {
      setCampuses(data);
      if (!initial?.campus && data.length > 0) setCampus(data[0].name);
    });
  }, [initial?.campus]);

  useEffect(() => {
    const campusEntry = campuses.find((c) => c.name === campus);
    if (!campusEntry) return;
    fetchPrograms(campusEntry.id).then((data) => {
      setPrograms(data);
      if (!initial?.program && data.length > 0) setProgram(data[0].name);
    });
  }, [campus, campuses, initial?.program]);

  useEffect(() => {
    const programEntry = programs.find((p) => p.name === program);
    if (!programEntry) {
      setCourses([]);
      return;
    }
    fetchCourses(programEntry.id).then(setCourses);
  }, [program, programs]);

  function toggleCourse(id: string) {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setConfirm(null);
    setError(null);

    try {
      const result = await saveAdminStudent(
        { firstName, lastName, email, campus, program, status },
        mode,
        initial?.id,
      );

      if (!result.ok) {
        setError('Erreur lors de l\'enregistrement. Vérifiez les champs.');
        return;
      }

      if (mode === 'create' && result.id && selectedCourses.length > 0) {
        await createEnrollments(result.id, selectedCourses);
      }

      setConfirm(
        mode === 'create'
          ? 'Fiche étudiant créée avec succès.'
          : 'Modifications enregistrées.',
      );
      setTimeout(() => router.push('/admin/etudiants'), 800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <Field label="Prénom">
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm focus:border-amber-700"
          />
        </Field>
        <Field label="Nom">
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm focus:border-amber-700"
          />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm focus:border-amber-700"
          />
        </Field>
        <Field label="Statut">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminStudent['status'])}
            className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="DIPLOME">Diplômé</option>
          </select>
        </Field>
        <Field label="Campus">
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Programme">
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      {mode === 'create' && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            Inscriptions aux cours
          </legend>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun cours disponible pour ce programme.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {courses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                  />
                  <span>
                    <span className="font-mono text-xs text-gray-600">{c.code}</span>{' '}
                    {c.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {confirm && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {confirm}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/etudiants')}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? 'Enregistrement…'
            : mode === 'create'
              ? 'Créer la fiche'
              : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}
