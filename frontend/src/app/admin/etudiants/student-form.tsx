'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { saveAdminStudent } from '@/lib/api';
import type { AdminStudent } from '@/lib/types';

interface Props {
  initial?: AdminStudent;
  mode: 'create' | 'edit';
}

const PROGRAMS = ['L1 INFO', 'L2 INFO', 'L3 INFO', 'M1 INFO', 'M2 INFO'];
const CAMPUSES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille'];
const COURSES = [
  { id: 'c-info-101', name: 'INFO101 — Algorithmique avancee' },
  { id: 'c-info-220', name: 'INFO220 — Bases de donnees' },
  { id: 'c-info-310', name: 'INFO310 — Architecture micro-services' },
  { id: 'c-math-220', name: 'MATH220 — Algebre lineaire' },
  { id: 'c-eng-150', name: 'ENG150 — Anglais professionnel' },
];

export function StudentForm({ initial, mode }: Props) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [campus, setCampus] = useState(initial?.campus ?? 'Paris');
  const [program, setProgram] = useState(initial?.program ?? 'L1 INFO');
  const [status, setStatus] = useState<AdminStudent['status']>(initial?.status ?? 'ACTIF');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  function toggleCourse(id: string) {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setConfirm(null);

    try {
      // POST /api/students ou PUT /api/students/:id (endpoints déclarés),
      // via le client api.ts qui résout campus_id/program_id par nom.
      // Les inscriptions cochées restent une démo UI (cours mocks).
      await saveAdminStudent(
        { firstName, lastName, email, campus, program, status },
        mode,
        initial?.id,
      );
      setConfirm(
        mode === 'create'
          ? 'Fiche etudiant creee avec succes.'
          : 'Modifications enregistrees.',
      );
      setTimeout(() => router.push('/admin/etudiants'), 800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <Field label="Prenom">
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
            <option value="DIPLOME">Diplome</option>
          </select>
        </Field>
        <Field label="Campus">
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>
                {c}
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
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">
          Inscriptions aux cours
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {COURSES.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedCourses.includes(c.id)}
                onChange={() => toggleCourse(c.id)}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
            ? 'Enregistrement...'
            : mode === 'create'
              ? 'Creer la fiche'
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
