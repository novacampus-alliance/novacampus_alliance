'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { WeekCalendar } from '@/components/week-calendar';
import { fetchInstructorSchedule } from '@/lib/api';
import type { ScheduleSlot } from '@/lib/types';

export default function TeacherPlanningPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);

  useEffect(() => {
    fetchInstructorSchedule().then(setSlots);
  }, []);

  return (
    <AppShell title="Emploi du temps" subtitle="Semaine en cours">
      <p className="mb-4 text-sm text-gray-600">
        Vue calendrier des creneaux que vous animez.
      </p>
      <WeekCalendar slots={slots} />
    </AppShell>
  );
}
