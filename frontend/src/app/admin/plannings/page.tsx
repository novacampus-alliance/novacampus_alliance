'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button, Card, StatusPill } from '@/components/ui';
import { WeekCalendar } from '@/components/week-calendar';
import { fetchAdminSchedule, fetchConflicts } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { ScheduleConflict, ScheduleSlot } from '@/lib/types';

type SlotDraft = {
  courseName: string;
  instructorName: string;
  roomName: string;
  campus: string;
  startsAt: string;
  endsAt: string;
};

export default function AdminPlanningsPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [campus, setCampus] = useState<string>('ALL');
  const [editing, setEditing] = useState<ScheduleSlot | null>(null);
  const [creating, setCreating] = useState(false);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSchedule().then(setSlots);
    fetchConflicts().then(setConflicts);
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

  function assignRoom(conflictId: string, roomName: string) {
    setResolved((prev) => new Set(prev).add(conflictId));
    setConfirm(`Salle ${roomName} attribuée. Conflit résolu.`);
    setTimeout(() => setConfirm(null), 3000);
  }

  function handleSaveSlot(draft: SlotDraft, slotId?: string) {
    setSlots((prev) => {
      if (slotId) {
        return prev.map((s) =>
          s.id === slotId
            ? {
                ...s,
                courseName: draft.courseName,
                instructorName: draft.instructorName,
                roomName: draft.roomName,
                roomId: draft.roomName.toLowerCase().replace(/\s+/g, '-'),
                campus: draft.campus,
                startsAt: draft.startsAt,
                endsAt: draft.endsAt,
              }
            : s,
        );
      }
      const newSlot: ScheduleSlot = {
        id: `local-${Date.now()}`,
        courseId: 'local',
        courseName: draft.courseName,
        instructorName: draft.instructorName,
        roomId: draft.roomName.toLowerCase().replace(/\s+/g, '-'),
        roomName: draft.roomName,
        campus: draft.campus,
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
      };
      return [...prev, newSlot];
    });
    setConfirm(slotId ? 'Créneau mis à jour.' : 'Nouveau créneau créé.');
    setTimeout(() => setConfirm(null), 3000);
    setEditing(null);
    setCreating(false);
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
            className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="ALL">Tous les campus</option>
            {campuses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button onClick={() => setCreating(true)}>+ Nouveau créneau</Button>
        </>
      }
    >
      {confirm && (
        <p role="status" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {confirm}
        </p>
      )}

      {conflicts.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Conflits détectés ({conflicts.filter((c) => !resolved.has(c.id)).length} ouverts)
          </h3>
          <div className="space-y-3">
            {conflicts.map((c) => {
              const isResolved = resolved.has(c.id);
              return (
                <article
                  key={c.id}
                  className={`rounded-lg border p-4 ${
                    isResolved
                      ? 'border-emerald-200 bg-emerald-50'
                      : c.severity === 'CRITICAL'
                        ? 'border-red-200 bg-red-50'
                        : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <header className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {isResolved ? 'Conflit résolu' : c.reason}
                      </div>
                      <div className="text-xs text-gray-600">
                        Sévérité : {c.severity === 'CRITICAL' ? 'Critique' : 'Avertissement'}
                      </div>
                    </div>
                    {isResolved && (
                      <StatusPill tone="success">Résolu</StatusPill>
                    )}
                  </header>
                  {!isResolved && (
                    <>
                      <ul className="mt-2 grid gap-1 text-xs text-gray-700 sm:grid-cols-2">
                        {c.slots.map((s) => (
                          <li key={s.id} className="rounded border bg-white px-2 py-1">
                            {s.courseName} · {formatDate(s.startsAt)}{' '}
                            {formatTime(s.startsAt)} — Salle {s.roomName}
                          </li>
                        ))}
                      </ul>
                      {c.suggestedRooms.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-700">
                            Suggestions de salles :
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {c.suggestedRooms.map((r) => (
                              <button
                                key={r.roomId}
                                onClick={() => assignRoom(c.id, r.roomName)}
                                aria-label={`Attribuer la salle ${r.roomName}`}
                                className="rounded-md border border-gray-500 bg-white px-2 py-1.5 text-xs font-medium hover:border-amber-700 hover:bg-brand-50"
                              >
                                {r.roomName} · cap. {r.capacity}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Vue calendrier ({campus === 'ALL' ? 'multi-campus' : campus})
        </h3>
        <WeekCalendar slots={filteredSlots} showCampus />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Liste des créneaux ({filteredSlots.length})
        </h3>
        <Card className="overflow-x-auto">
          <table aria-label="Liste des créneaux" className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">Cours</th>
                <th scope="col" className="px-4 py-3">Enseignant</th>
                <th scope="col" className="px-4 py-3">Campus</th>
                <th scope="col" className="px-4 py-3">Salle</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Horaires</th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun créneau trouvé.
                  </td>
                </tr>
              ) : (
                filteredSlots.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.courseName}</td>
                    <td className="px-4 py-3 text-gray-700">{s.instructorName}</td>
                    <td className="px-4 py-3 text-gray-700">{s.campus}</td>
                    <td className="px-4 py-3 text-gray-700">{s.roomName}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(s.startsAt)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(s)}
                        aria-label={`Éditer le créneau ${s.courseName}`}
                        className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                      >
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </section>

      {(creating || editing) && (
        <SlotDialog
          slot={editing ?? undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
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
  const [draft, setDraft] = useState<SlotDraft>({
    courseName: slot?.courseName ?? '',
    instructorName: slot?.instructorName ?? '',
    roomName: slot?.roomName ?? '',
    campus: slot?.campus ?? 'Paris',
    startsAt: slot?.startsAt.slice(0, 16) ?? '',
    endsAt: slot?.endsAt.slice(0, 16) ?? '',
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h3 className="mb-3 text-base font-semibold">
          {slot ? 'Éditer le créneau' : 'Nouveau créneau'}
        </h3>
        <div className="grid gap-3">
          <Field label="Cours" value={draft.courseName} onChange={(v) => setDraft({ ...draft, courseName: v })} />
          <Field label="Enseignant" value={draft.instructorName} onChange={(v) => setDraft({ ...draft, instructorName: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salle" value={draft.roomName} onChange={(v) => setDraft({ ...draft, roomName: v })} />
            <Field label="Campus" value={draft.campus} onChange={(v) => setDraft({ ...draft, campus: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Début" type="datetime-local" value={draft.startsAt} onChange={(v) => setDraft({ ...draft, startsAt: v })} />
            <Field label="Fin" type="datetime-local" value={draft.endsAt} onChange={(v) => setDraft({ ...draft, endsAt: v })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
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
