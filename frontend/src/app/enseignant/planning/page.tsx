'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { WeekCalendar } from '@/components/week-calendar';
import { fetchInstructorSchedule } from '@/lib/api';
import type { ScheduleSlot } from '@/lib/types';

export default function TeacherPlanningPage() {
  const [slots, setSlots] = useState<ScheduleSlot[] | null>(null);

  useEffect(() => {
    fetchInstructorSchedule().then(setSlots);
  }, []);

  return (
    <AppShell title="Emploi du temps" subtitle="Semaine en cours">
      <p className="mb-4 text-sm text-gray-600">
        Vue calendrier des créneaux que vous animez.
      </p>
      {slots === null ? (
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      ) : (
        <WeekCalendar slots={slots} />
      )}
    </AppShell>
  );
}
