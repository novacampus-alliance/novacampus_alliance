'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card, StatusPill } from '@/components/ui';
import { fetchConflicts } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { ScheduleConflict } from '@/lib/types';

export default function AdminConflictsPage() {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchConflicts().then(setConflicts);
  }, []);

  function assignRoom(conflictId: string, roomName: string) {
    setResolved((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => next.add(id));
      next.add(conflictId);
      return next;
    });
    setToast(`Salle ${roomName} attribuee. Conflit resolu.`);
    setTimeout(() => setToast(null), 3000);
  }

  const open = conflicts.filter((c) => !resolved.has(c.id));

  return (
    <AppShell title="Conflits" subtitle="Detection & resolution">
      <p className="mb-4 text-sm text-gray-600">
        {open.length} conflit(s) ouvert(s) sur l&apos;ensemble des campus.
        Choisissez une salle de remplacement parmi les suggestions.
      </p>

      {toast && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      <div className="space-y-3">
        {conflicts.map((c) => {
          const isResolved = resolved.has(c.id);
          return (
            <Card
              key={c.id}
              className={`p-4 ${
                isResolved
                  ? 'border-emerald-200 bg-emerald-50'
                  : c.severity === 'CRITICAL'
                    ? 'border-red-200'
                    : 'border-amber-200'
              }`}
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {isResolved ? 'Conflit resolu' : c.reason}
                  </div>
                  <div className="mt-0.5">
                    <StatusPill tone={c.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {c.severity}
                    </StatusPill>
                  </div>
                </div>
                {isResolved && <StatusPill tone="success">Resolu</StatusPill>}
              </header>

              {!isResolved && (
                <>
                  <ul className="mt-3 grid gap-1 text-xs text-gray-700 sm:grid-cols-2">
                    {c.slots.map((s) => (
                      <li key={s.id} className="rounded border bg-gray-50 px-2 py-1">
                        {s.courseName} · {formatDate(s.startsAt)}{' '}
                        {formatTime(s.startsAt)} — Salle {s.roomName} · {s.campus}
                      </li>
                    ))}
                  </ul>
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
                </>
              )}
            </Card>
          );
        })}
        {conflicts.length === 0 && (
          <p className="text-sm text-gray-600">Aucun conflit detecte.</p>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-600">
        Besoin de la vue calendrier ?{' '}
        <Link href="/admin/plannings" className="font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950">
          Ouvrir les plannings
        </Link>
      </p>
    </AppShell>
  );
}
