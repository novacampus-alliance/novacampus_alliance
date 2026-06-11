'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card, StatusPill } from '@/components/ui';
import { fetchConflicts } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { ScheduleConflict } from '@/lib/types';

type AiSuggestion = {
  type: string;
  target_schedule_id: string;
  target_course_name: string | null;
  proposed_room_name: string | null;
  proposed_instructor_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  impact: string;
};

type AiResult = {
  conflict_summary: string;
  explanation: string;
  suggestions: AiSuggestion[];
};

const CONFIDENCE_TONE = {
  high: 'success',
  medium: 'warning',
  low: 'neutral',
} as const;

export default function AdminConflictsPage() {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, AiResult>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [campusId, setCampusId] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<AiResult[] | null>(null);

  useEffect(() => {
    fetchConflicts().then(setConflicts);
  }, []);

  function assignRoom(conflictId: string, roomName: string) {
    setResolved((prev) => new Set(prev).add(conflictId));
    setToast(`Salle ${roomName} attribuée. Conflit résolu.`);
    setTimeout(() => setToast(null), 3000);
  }

  async function analyseConflict(conflict: ScheduleConflict, idx: number) {
    const schedA = conflict.slots[0];
    const schedB = conflict.slots[1];
    if (!schedA || !schedB) return;

    setAiLoading((prev) => ({ ...prev, [conflict.id]: true }));
    try {
      const res = await fetch('/api/v1/conflicts/suggest/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campus_id: campusId || schedA.campus || `campus-${idx}`,
          schedule_a_id: schedA.id,
          schedule_b_id: schedB.id,
        }),
      });
      if (!res.ok) {
        const err: { detail?: string } = await res.json().catch(() => ({}));
        setToast(`Erreur IA : ${err.detail ?? res.status}`);
        setTimeout(() => setToast(null), 4000);
        return;
      }
      const data: AiResult = await res.json();
      setAiResults((prev) => ({ ...prev, [conflict.id]: data }));
    } catch {
      setToast('Impossible de contacter le service IA. Vérifiez que le service est démarré.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setAiLoading((prev) => ({ ...prev, [conflict.id]: false }));
    }
  }

  async function analyseAll() {
    if (!campusId.trim()) {
      setToast('Saisissez un identifiant de campus pour analyser tous les conflits.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setBatchLoading(true);
    setBatchResults(null);
    try {
      const res = await fetch('/api/v1/conflicts/suggest/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campus_id: campusId }),
      });
      if (!res.ok) {
        const err: { detail?: string } = await res.json().catch(() => ({}));
        setToast(`Erreur IA : ${err.detail ?? res.status}`);
        setTimeout(() => setToast(null), 4000);
        return;
      }
      const data: { results: AiResult[] } = await res.json();
      setBatchResults(data.results ?? []);
    } catch {
      setToast('Impossible de contacter le service IA.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setBatchLoading(false);
    }
  }

  const open = conflicts.filter((c) => !resolved.has(c.id));

  return (
    <AppShell title="Conflits EDT" subtitle="Détection & résolution IA">
      {/* Barre d'action IA */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-400">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          Agent IA M7
        </span>
        <input
          type="text"
          placeholder="ID campus (ex: cam-paris)"
          value={campusId}
          onChange={(e) => setCampusId(e.target.value)}
          className="min-h-9 flex-1 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none"
        />
        <button
          onClick={analyseAll}
          disabled={batchLoading}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {batchLoading ? 'Analyse…' : 'Analyser tous les conflits'}
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        {open.length} conflit(s) ouvert(s) sur l&apos;ensemble des campus.
        Cliquez sur <strong>Analyser</strong> pour obtenir des suggestions de l&apos;agent IA.
      </p>

      {toast && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      {/* Résultats batch IA */}
      {batchResults && batchResults.length > 0 && (
        <Card className="mb-5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Résultats de l&apos;analyse IA — {batchResults.length} conflit(s)
          </h3>
          <div className="space-y-3">
            {batchResults.map((r, i) => (
              <AiResultCard key={i} result={r} />
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {conflicts.map((c, idx) => {
          const isResolved = resolved.has(c.id);
          const aiResult = aiResults[c.id];
          const loading = aiLoading[c.id];
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
              <header className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {isResolved ? 'Conflit résolu' : c.reason}
                  </div>
                  <div className="mt-0.5">
                    <StatusPill tone={c.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {c.severity === 'CRITICAL' ? 'Critique' : 'Avertissement'}
                    </StatusPill>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isResolved && <StatusPill tone="success">Résolu</StatusPill>}
                  {!isResolved && !aiResult && (
                    <button
                      onClick={() => analyseConflict(c, idx)}
                      disabled={loading}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {loading ? 'Analyse…' : '✦ Analyser avec l\'IA'}
                    </button>
                  )}
                </div>
              </header>

              {!isResolved && (
                <>
                  <ul className="mt-3 grid gap-1 text-xs text-gray-700 sm:grid-cols-2">
                    {c.slots.map((s) => (
                      <li key={s.id} className="rounded border bg-gray-50 px-2 py-1">
                        {s.courseName} · {formatDate(s.startsAt)}{' '}
                        {formatTime(s.startsAt)} — Salle {s.roomName}
                        {s.campus ? ` · ${s.campus}` : ''}
                      </li>
                    ))}
                  </ul>

                  {/* Suggestions de salles (frontend) */}
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

                  {/* Résultat IA pour ce conflit */}
                  {aiResult && (
                    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                        Analyse IA
                      </div>
                      <p className="mb-2 text-xs text-zinc-600">{aiResult.explanation}</p>
                      <div className="space-y-1.5">
                        {aiResult.suggestions.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs"
                          >
                            <StatusPill tone={CONFIDENCE_TONE[s.confidence]}>
                              {s.confidence}
                            </StatusPill>
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900">
                                {s.type === 'change_room' && `Changer de salle → ${s.proposed_room_name ?? '?'}`}
                                {s.type === 'change_instructor' && `Changer d'enseignant → ${s.proposed_instructor_name ?? '?'}`}
                                {s.type === 'reschedule' && 'Reprogrammer le créneau'}
                              </span>
                              <span className="ml-1 text-gray-500">{s.impact}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {aiResult.suggestions.some((s) => s.type === 'change_room' && s.proposed_room_name) && (
                        <button
                          onClick={() => {
                            const sug = aiResult.suggestions.find((s) => s.type === 'change_room' && s.proposed_room_name);
                            if (sug?.proposed_room_name) assignRoom(c.id, sug.proposed_room_name);
                          }}
                          className="mt-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          Appliquer la suggestion principale
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
        {conflicts.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-500">
              Aucun conflit détecté.{' '}
              <Link href="/admin/plannings" className="font-medium text-amber-900 underline underline-offset-2">
                Voir les plannings
              </Link>
            </p>
          </Card>
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

function AiResultCard({ result }: { result: AiResult }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
      <p className="mb-1 font-medium text-zinc-800">{result.conflict_summary}</p>
      <p className="mb-2 text-zinc-600">{result.explanation}</p>
      <div className="flex flex-wrap gap-2">
        {result.suggestions.slice(0, 2).map((s, i) => (
          <span key={i} className="rounded-full bg-white px-2 py-0.5 text-[11px] border border-zinc-200 text-zinc-700">
            {s.type === 'change_room' ? `→ ${s.proposed_room_name}` : s.type}
          </span>
        ))}
      </div>
    </div>
  );
}
