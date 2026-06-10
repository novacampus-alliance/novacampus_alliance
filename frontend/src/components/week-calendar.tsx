'use client';

import { formatTime } from '@/lib/format';
import type { ScheduleSlot } from '@/lib/types';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

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

export interface WeekCalendarProps {
  slots: ScheduleSlot[];
  highlightChanged?: Set<string>;
  /** Si vrai, affiche le campus dans chaque carte (vue admin multi-campus). */
  showCampus?: boolean;
}

export function WeekCalendar({
  slots,
  highlightChanged,
  showCampus,
}: WeekCalendarProps) {
  const weekStart = startOfWeek(new Date());
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

  return (
    <>
      <div className="hidden grid-cols-6 gap-3 md:grid">
        {DAYS.map((day, idx) => (
          <div key={day} className="min-h-[280px] rounded-lg border bg-white p-3">
            <div className="mb-2 text-sm font-medium text-gray-700">{day}</div>
            <div className="space-y-2">
              {(grouped[idx] ?? []).map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  changed={highlightChanged?.has(slot.id) ?? false}
                  showCampus={showCampus}
                />
              ))}
              {!grouped[idx]?.length && (
                <p className="text-xs text-gray-600">Aucun cours</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 md:hidden">
        {DAYS.map((day, idx) => {
          const list = grouped[idx] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={day}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{day}</h3>
              <div className="space-y-2">
                {list.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    changed={highlightChanged?.has(slot.id) ?? false}
                    showCampus={showCampus}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function SlotCard({
  slot,
  changed,
  showCampus,
}: {
  slot: ScheduleSlot;
  changed: boolean;
  showCampus?: boolean;
}) {
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
      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-600">
        <span>Salle {slot.roomName}</span>
        {showCampus && (
          <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-gray-700">
            {slot.campus}
          </span>
        )}
        {changed && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            Salle modifiee
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-600">{slot.instructorName}</div>
      {slot.studentGroup && (
        <div className="text-xs text-gray-600">{slot.studentGroup}</div>
      )}
    </div>
  );
}
