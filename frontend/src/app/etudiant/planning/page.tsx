'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { fetchSchedule } from '@/lib/api';
import { formatTime } from '@/lib/format';
import type { ScheduleSlot } from '@/lib/types';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const POLL_MS = 10_000;

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function diffDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export default function StudentPlanningPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [changedSlotIds, setChangedSlotIds] = useState<Set<string>>(new Set());
  const previousRooms = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let alive = true;

    async function load(initial = false) {
      const next = await fetchSchedule();
      if (!alive) return;

      if (!initial) {
        const changed = new Set<string>();
        for (const slot of next) {
          const prevRoom = previousRooms.current.get(slot.id);
          if (prevRoom && prevRoom !== slot.roomId) {
            changed.add(slot.id);
          }
        }
        if (changed.size > 0) {
          setChangedSlotIds((s) => {
            const merged = new Set<string>();
            s.forEach((id) => merged.add(id));
            changed.forEach((id) => merged.add(id));
            return merged;
          });
          setTimeout(() => {
            setChangedSlotIds((s) => {
              const copy = new Set<string>();
              s.forEach((id) => copy.add(id));
              changed.forEach((id) => copy.delete(id));
              return copy;
            });
          }, 15_000);
        }
      }

      previousRooms.current = new Map(next.map((s) => [s.id, s.roomId]));
      setSlots(next);
      setLastUpdate(new Date());
    }

    load(true);
    const interval = setInterval(() => load(false), POLL_MS);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);

  const slotsByDay = useMemo(() => {
    const grouped: Record<number, ScheduleSlot[]> = {};
    for (const slot of slots) {
      const start = new Date(slot.startsAt);
      const dayIdx = diffDays(startOfWeek(start), weekStart) === 0
        ? (start.getDay() === 0 ? 6 : start.getDay() - 1)
        : -1;
      if (dayIdx < 0 || dayIdx > 5) continue;
      grouped[dayIdx] ??= [];
      grouped[dayIdx].push(slot);
    }
    for (const k of Object.keys(grouped)) {
      grouped[+k].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }
    return grouped;
  }, [slots, weekStart]);

  return (
    <AppShell title="Emploi du temps" subtitle="Semaine en cours">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Semaine en cours</h2>
          <p className="text-sm text-gray-600">
            Mises a jour automatiques toutes les{' '}
            {Math.round(POLL_MS / 1000)} secondes
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-700" />
          En direct
          {lastUpdate && (
            <span className="ml-2">
              Derniere maj : {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {changedSlotIds.size > 0 && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <span aria-hidden className="mt-0.5 text-lg leading-none">!</span>
          <span>
            <strong>{changedSlotIds.size}</strong> changement(s) de salle detecte(s)
            sur votre planning. Les creneaux concernes sont surlignes.
          </span>
        </div>
      )}

      <div className="hidden grid-cols-6 gap-3 md:grid">
        {DAYS.map((day, idx) => (
          <div key={day} className="min-h-[300px] rounded-lg border bg-white p-3">
            <div className="mb-2 text-sm font-medium text-gray-700">{day}</div>
            <div className="space-y-2">
              {(slotsByDay[idx] ?? []).map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  changed={changedSlotIds.has(slot.id)}
                />
              ))}
              {!slotsByDay[idx]?.length && (
                <p className="text-xs text-gray-600">Aucun cours</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 md:hidden">
        {DAYS.map((day, idx) => {
          const list = slotsByDay[idx] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={day}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{day}</h3>
              <div className="space-y-2">
                {list.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    changed={changedSlotIds.has(slot.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function SlotCard({ slot, changed }: { slot: ScheduleSlot; changed: boolean }) {
  return (
    <div
      className={`rounded-md border p-3 text-sm transition-colors ${
        changed
          ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="font-medium text-gray-900">{slot.courseName}</div>
      <div className="text-xs text-gray-600">
        {formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
        <span>Salle {slot.roomName}</span>
        {changed && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            Salle modifiee
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-600">{slot.instructorName}</div>
    </div>
  );
}
