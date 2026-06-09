/** Convertit "HH:mm" ou "HH:mm:ss" en Date Prisma (@db.Time). */
export function parseTimeToDate(time: string): Date {
  const normalized = time.length === 5 ? `${time}:00` : time;
  return new Date(`1970-01-01T${normalized}.000Z`);
}

/** Compare deux créneaux horaires (même jour) — chevauchement si startA < endB && startB < endA. */
export function timesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}
