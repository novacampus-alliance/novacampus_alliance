'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { fetchRooms, saveTeacherCourse } from '@/lib/api';
import type { Room, TeacherCourse } from '@/lib/types';

interface Props {
  initial?: TeacherCourse;
  mode: 'create' | 'edit';
}

const PROGRAMS = ['L1 INFO', 'L2 INFO', 'L3 INFO', 'M1 INFO', 'M2 INFO'];
const CAMPUSES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Toulouse'];

/** Ressources pedagogiques affectables a un cours. */
export const TEACHING_RESOURCES = [
  'Videoprojecteur',
  'Tableau interactif',
  'Postes informatiques',
  'Materiel de laboratoire',
  'Kit robotique',
];

export function CourseForm({ initial, mode }: Props) {
  const router = useRouter();

  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [campus, setCampus] = useState(initial?.campus ?? 'Paris');
  const [program, setProgram] = useState(initial?.program ?? 'L3 INFO');
  const [roomId, setRoomId] = useState(initial?.roomId ?? '');
  const [resources, setResources] = useState<string[]>(initial?.resources ?? []);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms().then(setRooms);
  }, []);

  const campusRooms = rooms.filter((r) => r.campus === campus);

  function toggleResource(label: string) {
    setResources((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setConfirm(null);

    const room = rooms.find((r) => r.id === roomId);
    try {
      await saveTeacherCourse(
        {
          code,
          name,
          campus,
          program,
          roomId: room?.id,
          roomName: room?.name,
          resources,
        },
        mode,
        initial?.id,
      );
      setConfirm(
        mode === 'create'
          ? 'Cours cree avec succes.'
          : 'Modifications enregistrees.',
      );
      setTimeout(() => router.push('/enseignant/cours'), 800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <Field label="Code du cours">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="INFO101"
            className="w-full min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
          />
        </Field>
        <Field label="Intitule">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Algorithmique avancee"
            className="w-full min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
          />
        </Field>
        <Field label="Campus">
          <select
            value={campus}
            onChange={(e) => {
              setCampus(e.target.value);
              setRoomId('');
            }}
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
        <Field label="Salle">
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="">Aucune salle attribuee</option>
            {campusRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.type} · cap. {r.capacity}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">
          Ressources pedagogiques
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEACHING_RESOURCES.map((r) => (
            <label
              key={r}
              className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={resources.includes(r)}
                onChange={() => toggleResource(r)}
              />
              <span>{r}</span>
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
          onClick={() => router.push('/enseignant/cours')}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? 'Enregistrement...'
            : mode === 'create'
              ? 'Creer le cours'
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
