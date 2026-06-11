'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { fetchCampuses, fetchPrograms } from '@/lib/api';
import type { AdminStudent } from '@/lib/types';

const FALLBACK_PROGRAMS = ['L1 INFO', 'L2 INFO', 'L3 INFO', 'M1 INFO', 'M2 INFO'];
const FALLBACK_CAMPUSES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille'];

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
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCampuses().then((data) => {
      if (data.length > 0) {
        setCampuses(data);
        if (!campus) setCampus(data[0].name);
      } else {
        setCampuses(FALLBACK_CAMPUSES.map((n) => ({ id: n, name: n })));
        if (!campus) setCampus(FALLBACK_CAMPUSES[0]);
      }
    });
    fetchPrograms().then((data) => {
      if (data.length > 0) {
        setPrograms(data);
        if (!program) setProgram(data[0].name);
      } else {
        setPrograms(FALLBACK_PROGRAMS.map((n) => ({ id: n, name: n })));
        if (!program) setProgram(FALLBACK_PROGRAMS[0]);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setConfirm(null);
    setError(null);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      campus_id: campuses.find((c) => c.name === campus)?.id ?? campus,
      program_id: programs.find((p) => p.name === program)?.id ?? program,
      status,
    };

    try {
      const url = mode === 'create' ? '/api/students' : `/api/students/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body: { message?: string } = await res.json().catch(() => ({}));
        setError(body.message ?? `Erreur ${res.status}`);
        return;
      }
      setConfirm(
        mode === 'create'
          ? 'Fiche étudiant créée avec succès.'
          : 'Modifications enregistrées.',
      );
      setTimeout(() => router.push('/admin/etudiants'), 800);
    } catch {
      setError('Impossible de contacter le serveur.');
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
              <option key={c.id} value={c.name}>{c.name}</option>
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
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </Field>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {confirm && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}
