'use client';

import { useMemo, useState } from 'react';
import { formatTime } from '@/lib/format';
import type { ScheduleSlot } from '@/lib/types';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** Bornes par defaut de la journee affichee (etendues si un cours deborde). */
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;
/** Hauteur d'une heure dans la grille, en pixels. */
const HOUR_PX = 56;

/**
 * Accents de couleur par cours. La couleur est un repere supplementaire :
 * l'information reste portee par le texte (nom du cours, salle, badge).
 * Contrastes AAA : texte *-950 / gray-700+ sur fonds *-50.
 */
const COURSE_COLORS = [
  { border: 'border-l-sky-700', bg: 'bg-sky-50', accent: 'text-sky-950' },
  { border: 'border-l-emerald-700', bg: 'bg-emerald-50', accent: 'text-emerald-950' },
  { border: 'border-l-violet-700', bg: 'bg-violet-50', accent: 'text-violet-950' },
  { border: 'border-l-rose-700', bg: 'bg-rose-50', accent: 'text-rose-950' },
  { border: 'border-l-amber-700', bg: 'bg-amber-50', accent: 'text-amber-950' },
  { border: 'border-l-teal-700', bg: 'bg-teal-50', accent: 'text-teal-950' },
] as const;

type CourseColor = (typeof COURSE_COLORS)[number];

/**
 * Attribue les couleurs dans l'ordre chronologique d'apparition des cours :
 * stable pour une meme semaine, et sans doublon tant qu'il y a moins de
 * cours distincts que de couleurs.
 */
function buildCourseColors(slots: ScheduleSlot[]) {
  const map = new Map<string, CourseColor>();
  const ordered = [...slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const slot of ordered) {
    if (!map.has(slot.courseId)) {
      map.set(slot.courseId, COURSE_COLORS[map.size % COURSE_COLORS.length]);
    }
  }
  return map;
}

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

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

interface PositionedSlot {
  slot: ScheduleSlot;
  startMin: number;
  endMin: number;
  /** Colonne occupee quand plusieurs cours se chevauchent. */
  lane: number;
  lanes: number;
}

/**
 * Repartit les cours d'une journee en « couloirs » lorsque des creneaux se
 * chevauchent (vue admin multi-campus) : chaque groupe de creneaux qui se
 * recouvrent partage la largeur de la colonne.
 */
function layoutDay(slots: ScheduleSlot[]): PositionedSlot[] {
  const items: PositionedSlot[] = slots
    .map((slot) => ({
      slot,
      startMin: minutesOfDay(slot.startsAt),
      endMin: Math.max(minutesOfDay(slot.endsAt), minutesOfDay(slot.startsAt) + 30),
      lane: 0,
      lanes: 1,
    }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  let clusterStart = 0;
  let clusterMaxEnd = -1;
  let laneEnds: number[] = [];

  const closeCluster = (endIdx: number) => {
    for (let i = clusterStart; i < endIdx; i++) items[i].lanes = laneEnds.length;
  };

  items.forEach((item, idx) => {
    if (idx > 0 && item.startMin >= clusterMaxEnd) {
      closeCluster(idx);
      clusterStart = idx;
      laneEnds = [];
    }
    let lane = laneEnds.findIndex((end) => end <= item.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMin);
    } else {
      laneEnds[lane] = item.endMin;
    }
    item.lane = lane;
    clusterMaxEnd = Math.max(clusterMaxEnd, item.endMin);
  });
  closeCluster(items.length);

  return items;
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
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const todayIdx =
    weekOffset === 0 ? (today.getDay() === 0 ? 6 : today.getDay() - 1) : -1;

  const courseColors = useMemo(() => buildCourseColors(slots), [slots]);

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

  // Bornes horaires : 8h-18h, etendues si un cours sort de la plage.
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const list of Object.values(grouped)) {
    for (const s of list) {
      startHour = Math.min(startHour, Math.floor(minutesOfDay(s.startsAt) / 60));
      endHour = Math.max(endHour, Math.ceil(minutesOfDay(s.endsAt) / 60));
    }
  }
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const bodyHeight = (endHour - startHour) * HOUR_PX;

  const utcOffset = -new Date().getTimezoneOffset() / 60;
  const utcLabel = `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`;

  const weekEnd = addDays(weekStart, 5);
  const rangeLabel = `${weekStart.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })} – ${weekEnd.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  const weekIsEmpty = Object.keys(grouped).length === 0;

  return (
    <>
      {/* ----------------------- Vue grille (desktop) ----------------------- */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        {/* Barre d'outils : periode + navigation de semaine */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-bold capitalize text-gray-900">
            {rangeLabel}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Semaine precedente"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-500 text-gray-800 hover:bg-gray-100"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="min-h-11 rounded-lg border border-gray-500 px-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-600"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Semaine suivante"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-500 text-gray-800 hover:bg-gray-100"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        {/* En-tete des jours */}
        <div
          className="grid border-b border-gray-200 bg-gray-50"
          style={{ gridTemplateColumns: `64px repeat(6, minmax(0, 1fr))` }}
        >
          <div className="flex items-center justify-center py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            {utcLabel}
          </div>
          {DAYS_SHORT.map((day, idx) => {
            const date = addDays(weekStart, idx);
            const isToday = idx === todayIdx;
            return (
              <div
                key={day}
                className="flex items-center justify-center gap-1.5 border-l border-gray-200 py-2"
              >
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isToday ? 'bg-zinc-950 text-white' : 'text-gray-700'
                  }`}
                >
                  <span className="uppercase tracking-wide">{day}</span>
                  <span className="tabular-nums">{date.getDate()}</span>
                  {isToday && <span className="sr-only">(aujourd&apos;hui)</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Corps : gouttiere des heures + 6 colonnes jour */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `64px repeat(6, minmax(0, 1fr))` }}
        >
          {/* Heures */}
          <div className="relative" style={{ height: bodyHeight }}>
            {hours.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-gray-600"
                style={{ top: i === 0 ? 8 : i * HOUR_PX }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {DAYS.map((day, idx) => {
            const positioned = layoutDay(grouped[idx] ?? []);
            const isToday = idx === todayIdx;
            return (
              <div
                key={day}
                role="list"
                aria-label={`${day} ${addDays(weekStart, idx).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                className={`relative border-l border-gray-200 ${
                  isToday ? 'bg-brand-50/50' : ''
                }`}
                style={{ height: bodyHeight }}
              >
                {/* Lignes d'heures */}
                {hours.map((h, i) =>
                  i === 0 ? null : (
                    <div
                      key={h}
                      aria-hidden="true"
                      className="absolute inset-x-0 border-t border-gray-100"
                      style={{ top: i * HOUR_PX }}
                    />
                  ),
                )}

                {positioned.map(({ slot, startMin, endMin, lane, lanes }) => {
                  const color = courseColors.get(slot.courseId) ?? COURSE_COLORS[0];
                  const changed = highlightChanged?.has(slot.id) ?? false;
                  const top = ((startMin - startHour * 60) / 60) * HOUR_PX;
                  const height = ((endMin - startMin) / 60) * HOUR_PX;
                  return (
                    <div
                      key={slot.id}
                      role="listitem"
                      className="absolute px-0.5 py-0.5"
                      style={{
                        top,
                        height,
                        left: `${(lane / lanes) * 100}%`,
                        width: `${100 / lanes}%`,
                      }}
                    >
                      <div
                        className={`flex h-full flex-col gap-0.5 overflow-hidden rounded-lg border border-gray-200 border-l-4 px-2.5 py-1.5 text-left ${color.border} ${color.bg} ${
                          changed ? 'ring-2 ring-inset ring-amber-700' : ''
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold leading-tight tabular-nums ${color.accent}`}
                        >
                          {formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}
                        </span>
                        <span className="text-xs font-semibold leading-snug text-gray-900">
                          {slot.courseName}
                        </span>
                        <span className="text-[11px] leading-tight text-gray-700">
                          Salle {slot.roomName}
                          {showCampus && ` · ${slot.campus}`}
                          {' · '}
                          {slot.instructorName}
                        </span>
                        {changed && (
                          <span className="mt-0.5 w-fit rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-700/40">
                            Salle modifiee
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {weekIsEmpty && (
          <p className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
            Aucun cours planifie sur cette semaine.
          </p>
        )}
      </div>

      {/* ------------------------ Vue liste (mobile) ------------------------ */}
      <div className="space-y-4 md:hidden">
        {DAYS.map((day, idx) => {
          const list = (grouped[idx] ?? [])
            .slice()
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
          if (list.length === 0) return null;
          return (
            <section key={day}>
              <h3 className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-gray-900">
                {day}
                <span className="text-xs font-normal tabular-nums text-gray-600">
                  {addDays(weekStart, idx).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </h3>
              <div className="space-y-2">
                {list.map((slot) => {
                  const color = courseColors.get(slot.courseId) ?? COURSE_COLORS[0];
                  const changed = highlightChanged?.has(slot.id) ?? false;
                  return (
                    <div
                      key={slot.id}
                      className={`rounded-lg border border-gray-200 border-l-4 px-3 py-2.5 text-sm ${color.border} ${color.bg} ${
                        changed ? 'ring-2 ring-inset ring-amber-700' : ''
                      }`}
                    >
                      <div className={`text-xs font-bold tabular-nums ${color.accent}`}>
                        {formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}
                      </div>
                      <div className="mt-0.5 font-semibold leading-snug text-gray-900">
                        {slot.courseName}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-700">
                        <span>Salle {slot.roomName}</span>
                        {showCampus && (
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-700 ring-1 ring-gray-500/40">
                            {slot.campus}
                          </span>
                        )}
                        {changed && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-700/40">
                            Salle modifiee
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-700">
                        {slot.instructorName}
                      </div>
                      {slot.studentGroup && (
                        <div className="text-xs text-gray-700">
                          {slot.studentGroup}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {slots.length === 0 && (
          <p className="text-sm text-gray-600">Aucun cours planifie.</p>
        )}
      </div>
    </>
  );
}
