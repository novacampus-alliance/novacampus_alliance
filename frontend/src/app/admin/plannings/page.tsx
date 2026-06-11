'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button, Card } from '@/components/ui';
import { WeekCalendar } from '@/components/week-calendar';
import Link from 'next/link';
import {
  createSchedule,
  fetchAdminSchedule,
  fetchConflicts,
  fetchCourses,
  fetchInstructors,
  fetchRooms,
  updateSchedule,
} from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { ScheduleConflict, ScheduleSlot } from '@/lib/types';

type SlotDraft = {
  courseId: string;
  instructorId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
};

function isoToScheduleFields(iso: string): { dayOfWeek: number; time: string } {
  const d = new Date(iso);
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { dayOfWeek, time };
}

function ConflictsBanner({ conflicts }: { conflicts: ScheduleConflict[] }) {
  const byCampus = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of conflicts) {
      const name = c.campusName || 'Campus inconnu';
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [conflicts]);

  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-red-800">
          ⚠ {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''} sur {byCampus.length} campus
        </span>
        <Link
          href="/admin/conflits"
          className="shrink-0 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
        >
          Résoudre avec l&apos;agent M7 →
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {byCampus.map(([name, count]) => (
          <li key={name}>
            <Link
              href={`/admin/conflits?campus=${encodeURIComponent(name)}`}
              className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs text-red-700 hover:bg-red-100 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="font-medium">{count} conflit{count > 1 ? 's' : ''}</span>
              <span className="text-red-500">·</span>
              <span>{name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminPlanningsPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [campus, setCampus] = useState<string>('ALL');
  const [editing, setEditing] = useState<ScheduleSlot | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  async function reload() {
    const [nextSlots, nextConflicts] = await Promise.all([
      fetchAdminSchedule(),
      fetchConflicts(),
    ]);
    setSlots(nextSlots);
    setConflicts(nextConflicts);
  }

  useEffect(() => {
    reload();
  }, []);

  const campuses = useMemo(() => {
    const set = new Set<string>();
    slots.forEach((s) => set.add(s.campus));
    return Array.from(set).sort();
  }, [slots]);

  const filteredSlots = useMemo(
    () => slots.filter((s) => campus === 'ALL' || s.campus === campus),
    [slots, campus],
  );

  async function handleSaveSlot(draft: SlotDraft, slotId?: string) {
    const start = isoToScheduleFields(draft.startsAt);
    const end = isoToScheduleFields(draft.endsAt);

    const ok = slotId
      ? await updateSchedule(slotId, {
          courseId: draft.courseId,
          instructorId: draft.instructorId,
          roomId: draft.roomId,
          dayOfWeek: start.dayOfWeek,
          startTime: start.time,
          endTime: end.time,
        })
      : await createSchedule({
          courseId: draft.courseId,
          instructorId: draft.instructorId,
          roomId: draft.roomId,
          dayOfWeek: start.dayOfWeek,
          startTime: start.time,
          endTime: end.time,
        });

    if (!ok) {
      setConfirm('Erreur lors de l\'enregistrement du créneau.');
      setTimeout(() => setConfirm(null), 3000);
      return;
    }

    setConfirm(slotId ? 'Créneau mis à jour.' : 'Nouveau créneau créé.');
    setTimeout(() => setConfirm(null), 3000);
    setEditing(null);
    setCreating(false);
    await reload();
  }

  return (
    <AppShell
      title="Plannings multi-campus"
      subtitle="Vue globale & conflits"
      actions={
        <>
          <select
            aria-label="Filtrer par campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
          >
            <option value="ALL">Tous les campus</option>
            {campuses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button onClick={() => setCreating(true)}>+ Nouveau creneau</Button>
        </>
      }
    >

      {confirm && (
        <p role="status" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {confirm}
        </p>
      )}

      {conflicts.length > 0 && (
        <ConflictsBanner conflicts={conflicts} />
      )}

      <section className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Vue calendrier ({campus === 'ALL' ? 'multi-campus' : campus})
        </h3>
        <WeekCalendar slots={filteredSlots} showCampus />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Liste des creneaux
        </h3>
        <Card className="overflow-x-auto">
          <table aria-label="Liste des creneaux" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Cours</th>
                <th scope="col" className="px-4 py-3">Enseignant</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3">Salle</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Horaires</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSlots.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.courseName}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.instructorName}</td>
                  <td className="px-4 py-3 text-gray-700">{s.campus}</td>
                  <td className="px-4 py-3 text-gray-700">{s.roomName}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(s.startsAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(s)}
                      aria-label={`Editer le creneau ${s.courseName}`}
                      className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    >
                      Editer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {(creating || editing) && (
        <SlotDialog
          slot={editing ?? undefined}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(draft) => handleSaveSlot(draft, editing?.id)}
        />
      )}
    </AppShell>
  );
}

function SlotDialog({
  slot,
  onSave,
  onClose,
}: {
  slot?: ScheduleSlot;
  onSave: (draft: SlotDraft) => void;
  onClose: () => void;
}) {
  const [courses, setCourses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string; campus: string }[]>([]);
  const [draft, setDraft] = useState<SlotDraft>({
    courseId: slot?.courseId ?? '',
    instructorId: slot?.instructorId ?? '',
    roomId: slot?.roomId ?? '',
    startsAt: slot?.startsAt.slice(0, 16) ?? '',
    endsAt: slot?.endsAt.slice(0, 16) ?? '',
  });

  useEffect(() => {
    fetchCourses().then(setCourses);
    fetchInstructors().then(setInstructors);
    fetchRooms().then((r) =>
      setRooms(r.map((room) => ({ id: room.id, name: room.name, campus: room.campus }))),
    );
  }, []);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h3 className="mb-3 text-base font-semibold">
          {slot ? 'Éditer le créneau' : 'Nouveau créneau'}
        </h3>
        <div className="grid gap-3">
          <SelectField
            label="Cours"
            value={draft.courseId}
            onChange={(v) => setDraft({ ...draft, courseId: v })}
            options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
          />
          <SelectField
            label="Enseignant"
            value={draft.instructorId}
            onChange={(v) => setDraft({ ...draft, instructorId: v })}
            options={instructors.map((i) => ({ value: i.id, label: i.name }))}
          />
          <SelectField
            label="Salle"
            value={draft.roomId}
            onChange={(v) => setDraft({ ...draft, roomId: v })}
            options={rooms.map((r) => ({ value: r.id, label: `${r.name} (${r.campus})` }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Début"
              type="datetime-local"
              value={draft.startsAt}
              onChange={(v) => setDraft({ ...draft, startsAt: v })}
            />
            <Input
              label="Fin"
              type="datetime-local"
              value={draft.endsAt}
              onChange={(v) => setDraft({ ...draft, endsAt: v })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => onSave(draft)}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 rounded-md border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
      >
        <option value="">— Sélectionner —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm focus:border-amber-700"
      />
    </label>
  );
}
