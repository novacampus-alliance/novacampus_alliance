'use client';

import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { WeekCalendar } from '@/components/week-calendar';
import { fetchSchedule } from '@/lib/api';
import type { ScheduleSlot } from '@/lib/types';

const POLL_MS = 10_000;

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

  return (
    <AppShell title="Emploi du temps" subtitle="Semaine en cours">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Semaine en cours</h2>
          <p className="text-sm text-gray-600">
            Mises à jour automatiques toutes les {Math.round(POLL_MS / 1000)} secondes
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-700" />
          En direct
          {lastUpdate && (
            <span className="ml-2">
              Dernière maj : {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {changedSlotIds.size > 0 && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <span aria-hidden className="mt-0.5 text-lg leading-none">⚠</span>
          <span>
            <strong>{changedSlotIds.size}</strong> changement(s) de salle détecté(s) sur
            votre planning. Les créneaux concernés sont surlignés.
          </span>
        </div>
      )}

      <WeekCalendar slots={slots} highlightChanged={changedSlotIds} />
    </AppShell>
  );
}
