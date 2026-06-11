'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card, StatusPill } from '@/components/ui';
import {
  fetchConflicts,
  callAiSuggestAuto,
  applyAiSuggestion,
} from '@/lib/api';
import type { AiConflictSuggestion, AiSuggestion } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { ScheduleConflict } from '@/lib/types';

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-red-100 text-red-800 border-red-300',
};
const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
};

function suggestionLabel(s: AiSuggestion): string {
  if (s.type === 'change_room') {
    return `Changer la salle → ${s.proposedRoomName ?? s.proposedRoomId ?? '?'}`;
  }
  if (s.type === 'reschedule') {
    const day = s.proposedDayOfWeek ? DAY_NAMES[s.proposedDayOfWeek] : '?';
    return `Redéplanifier → ${day} ${s.proposedStartTime ?? ''}–${s.proposedEndTime ?? ''}`;
  }
  if (s.type === 'change_instructor') {
    return `Changer l'enseignant → ${s.proposedInstructorName ?? s.proposedInstructorId ?? '?'}`;
  }
  return s.type;
}

export default function AdminConflictsPage() {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiResults, setAiResults] = useState<
    Map<string, AiConflictSuggestion | null>
  >(new Map());
  const [aiLoading, setAiLoading] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const autoAnalyzed = useRef(false);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadConflicts() {
    setLoading(true);
    const data = await fetchConflicts();
    setConflicts(data);
    setLoading(false);
    return data;
  }

  async function analyzeOne(conflict: ScheduleConflict) {
    const [aId, bId] = conflict.id.split('-');
    if (!aId || !bId) return;
    setAiLoading((prev) => {
      const next = new Set(prev);
      next.add(conflict.id);
      return next;
    });
    const result = await callAiSuggestAuto(conflict.campusId || aId, aId, bId);
    setAiResults((prev) => new Map(prev).set(conflict.id, result));
    setAiLoading((prev) => {
      const next = new Set(prev);
      next.delete(conflict.id);
      return next;
    });
  }

  async function analyzeAll(data: ScheduleConflict[]) {
    await Promise.all(data.map(analyzeOne));
  }

  useEffect(() => {
    loadConflicts().then((data) => {
      if (!autoAnalyzed.current && data.length > 0) {
        autoAnalyzed.current = true;
        analyzeAll(data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApply(conflictId: string, suggestion: AiSuggestion) {
    const key = `${conflictId}-${suggestion.targetScheduleId}-${suggestion.type}`;
    setApplying((prev) => new Set(prev).add(key));
    const ok = await applyAiSuggestion(suggestion);
    setApplying((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    if (!ok) {
      showToast('Erreur lors de l\'application de la suggestion.', false);
      return;
    }
    setResolved((prev) => new Set(prev).add(conflictId));
    showToast('Suggestion appliquée. Conflit résolu.');
    const updated = await fetchConflicts();
    setConflicts(updated);
    setAiResults((prev) => {
      const next = new Map(prev);
      next.delete(conflictId);
      return next;
    });
    await Promise.all(updated.map((c) => {
      if (!aiResults.has(c.id)) return analyzeOne(c);
      return Promise.resolve();
    }));
  }

  const open = conflicts.filter((c) => !resolved.has(c.id));

  return (
    <AppShell title="Conflits EDT" subtitle="Détection & résolution par l'agent M7">
      {toast && (
        <div
          role="status"
          className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
            toast.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm text-gray-600">
          {loading
            ? 'Chargement des conflits…'
            : `${open.length} conflit(s) ouvert(s). L'agent M7 analyse automatiquement chaque conflit et propose les meilleures résolutions.`}
        </p>
        <button
          onClick={() => loadConflicts().then(analyzeAll)}
          disabled={loading}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
        >
          ↺ Recharger & réanalyser
        </button>
      </div>

      <div className="space-y-4">
        {open.map((c) => {
          const ai = aiResults.get(c.id);
          const isAnalyzing = aiLoading.has(c.id);

          return (
            <Card
              key={c.id}
              className={`p-4 ${
                c.severity === 'CRITICAL' ? 'border-red-200' : 'border-amber-200'
              }`}
            >
              {/* En-tête conflit */}
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={c.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {c.conflictType === 'instructor' ? 'Enseignant' : 'Salle'}
                    </StatusPill>
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {c.reason}
                    </span>
                  </div>
                  <ul className="mt-2 grid gap-1 text-xs text-gray-700 sm:grid-cols-2">
                    {c.slots.map((s) => (
                      <li key={s.id} className="rounded border bg-gray-50 px-2 py-1.5">
                        <span className="font-medium">{s.courseName}</span>
                        <br />
                        {formatDate(s.startsAt)} {formatTime(s.startsAt)} — Salle {s.roomName}
                        <br />
                        <span className="text-gray-500">{s.instructorName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {!ai && !isAnalyzing && (
                  <button
                    onClick={() => analyzeOne(c)}
                    className="shrink-0 rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100"
                  >
                    Analyser
                  </button>
                )}
              </header>

              {/* Panneau IA */}
              {isAnalyzing && (
                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
                  <span className="animate-pulse">Agent M7 en cours d&apos;analyse…</span>
                </div>
              )}

              {ai && (
                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
                  {/* Badge IA */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                      Agent M7
                    </span>
                    <span className="text-[10px] text-violet-600">
                      {ai.provider}{ai.model ? ` · ${ai.model}` : ''}
                    </span>
                  </div>

                  {/* Explication */}
                  <p className="mb-3 text-xs text-violet-900 leading-relaxed">
                    {ai.explanation}
                  </p>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    {ai.suggestions.map((s, i) => {
                      const key = `${c.id}-${s.targetScheduleId}-${s.type}`;
                      const isApplying = applying.has(key);
                      return (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 rounded-md border border-violet-100 bg-white px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${CONFIDENCE_STYLE[s.confidence]}`}
                              >
                                Confiance : {CONFIDENCE_LABEL[s.confidence] ?? s.confidence}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-gray-800">
                              {suggestionLabel(s)}
                            </p>
                            {s.impact && (
                              <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">
                                {s.impact}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleApply(c.id, s)}
                            disabled={isApplying}
                            className="shrink-0 rounded-lg bg-violet-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                          >
                            {isApplying ? '…' : 'Appliquer'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => analyzeOne(c)}
                    className="mt-2 text-[11px] text-violet-600 underline underline-offset-2 hover:text-violet-800"
                  >
                    Réanalyser
                  </button>
                </div>
              )}
            </Card>
          );
        })}

        {/* Conflits résolus dans cette session */}
        {resolved.size > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✓ {resolved.size} conflit(s) résolu(s) dans cette session.
          </div>
        )}

        {!loading && open.length === 0 && resolved.size === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-500">
              Aucun conflit détecté sur l&apos;ensemble des campus.
            </p>
          </Card>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Besoin de la vue calendrier ?{' '}
        <Link
          href="/admin/plannings"
          className="font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
        >
          Ouvrir les plannings
        </Link>
      </p>
    </AppShell>
  );
}
