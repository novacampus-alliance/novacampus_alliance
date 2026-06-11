'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const SUGGESTION_TYPE_LABEL: Record<string, string> = {
  change_room: 'Changer de salle',
  reschedule: 'Déplacer le créneau',
  change_instructor: "Changer d'enseignant",
};
const SUGGESTION_TYPE_ICON: Record<string, string> = {
  change_room: '🏫',
  reschedule: '📅',
  change_instructor: '👤',
};

const DAY_NAMES = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-red-100 text-red-700 border-red-200',
};
const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Confiance élevée',
  medium: 'Confiance moyenne',
  low: 'Confiance faible',
};

function suggestionValue(s: AiSuggestion): string {
  if (s.type === 'change_room') {
    return s.proposedRoomName ?? s.proposedRoomId ?? '—';
  }
  if (s.type === 'reschedule') {
    const day = s.proposedDayOfWeek ? DAY_NAMES[s.proposedDayOfWeek] : '';
    const hours = s.proposedStartTime && s.proposedEndTime
      ? `${s.proposedStartTime.slice(0, 5)} – ${s.proposedEndTime.slice(0, 5)}`
      : '';
    return [day, hours].filter(Boolean).join(', ') || '—';
  }
  if (s.type === 'change_instructor') {
    return s.proposedInstructorName ?? s.proposedInstructorId ?? '—';
  }
  return '—';
}

function AiPanel({
  ai,
  conflictId,
  applying,
  onApply,
  onReanalyze,
}: {
  ai: AiConflictSuggestion;
  conflictId: string;
  applying: Set<string>;
  onApply: (s: AiSuggestion) => void;
  onReanalyze: () => void;
}) {
  const [open, setOpen] = useState(false);
  const best = ai.suggestions.find((s) => s.confidence === 'high') ?? ai.suggestions[0];

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
      {/* En-tête IA */}
      <div className="flex items-center gap-2 border-b border-violet-100 bg-white/60 px-3 py-2">
        <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Agent M7
        </span>
        <span className="text-[11px] text-violet-500">
          {ai.provider}{ai.model ? ` · ${ai.model}` : ''}
        </span>
        {best && (
          <span className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_STYLE[best.confidence]}`}>
            {CONFIDENCE_LABEL[best.confidence]}
          </span>
        )}
      </div>

      {/* Corps */}
      <div className="p-3 space-y-2">
        {/* Résumé */}
        {ai.conflictSummary && (
          <p className="text-xs font-medium text-violet-900">{ai.conflictSummary}</p>
        )}

        {/* Explication masquée par défaut */}
        <div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800"
          >
            <span>{open ? '▾' : '▸'}</span>
            <span>{open ? 'Masquer l\'analyse détaillée' : 'Voir l\'analyse détaillée'}</span>
          </button>
          {open && (
            <p className="mt-1.5 text-xs text-violet-800 leading-relaxed whitespace-pre-line border-l-2 border-violet-300 pl-2.5">
              {ai.explanation}
            </p>
          )}
        </div>

        {/* Suggestions */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
            Solutions proposées
          </p>
          {ai.suggestions.map((s, i) => {
            const key = `${conflictId}-${s.targetScheduleId}-${s.type}`;
            const isApplying = applying.has(key);
            const isRecommended = s === best && s.confidence === 'high';
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 ${
                  isRecommended ? 'border-emerald-200 ring-1 ring-emerald-200' : 'border-violet-100'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm" aria-hidden>
                      {SUGGESTION_TYPE_ICON[s.type] ?? '•'}
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {SUGGESTION_TYPE_LABEL[s.type] ?? s.type}
                    </span>
                    {isRecommended && (
                      <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {suggestionValue(s)}
                  </p>
                  {s.impact && (
                    <p className="text-[11px] text-gray-400 leading-snug">{s.impact}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${CONFIDENCE_STYLE[s.confidence]}`}>
                    {CONFIDENCE_LABEL[s.confidence]}
                  </span>
                  <button
                    onClick={() => onApply(s)}
                    disabled={isApplying}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50 ${
                      isRecommended
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-violet-600 hover:bg-violet-700'
                    }`}
                  >
                    {isApplying ? '…' : 'Appliquer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onReanalyze}
          className="text-[11px] text-violet-400 underline underline-offset-2 hover:text-violet-700"
        >
          ↺ Réanalyser ce conflit
        </button>
      </div>
    </div>
  );
}

function AdminConflictsContent() {
  const searchParams = useSearchParams();
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [campusFilter, setCampusFilter] = useState<string>(
    searchParams.get('campus') ?? 'ALL',
  );

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

  const campusList = useMemo(() => {
    const names = new Set<string>();
    for (const c of conflicts) {
      const name = c.slots[0]?.campus;
      if (name) names.add(name);
    }
    return Array.from(names).sort();
  }, [conflicts]);

  const byCampus = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of conflicts) {
      if (resolved.has(c.id)) continue;
      const name = c.slots[0]?.campus || 'Campus inconnu';
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return map;
  }, [conflicts, resolved]);

  const open = conflicts.filter(
    (c) =>
      !resolved.has(c.id) &&
      (campusFilter === 'ALL' || c.slots[0]?.campus === campusFilter),
  );

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

      {/* Répartition par campus */}
      {!loading && campusList.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCampusFilter('ALL')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              campusFilter === 'ALL'
                ? 'border-amber-400 bg-amber-100 text-amber-900'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tous les campus
            <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
              {Array.from(byCampus.values()).reduce((a, b) => a + b, 0)}
            </span>
          </button>
          {campusList.map((name) => {
            const count = byCampus.get(name) ?? 0;
            return (
              <button
                key={name}
                onClick={() => setCampusFilter(name)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  campusFilter === name
                    ? 'border-red-400 bg-red-100 text-red-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {name}
                {count > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm text-gray-600">
          {loading
            ? 'Chargement des conflits…'
            : `${open.length} conflit${open.length > 1 ? 's' : ''} ouvert${open.length > 1 ? 's' : ''}${campusFilter !== 'ALL' ? ` sur ${campusFilter}` : ''}. L'agent M7 analyse automatiquement et propose les meilleures résolutions.`}
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
                <AiPanel
                  ai={ai}
                  conflictId={c.id}
                  applying={applying}
                  onApply={(s) => handleApply(c.id, s)}
                  onReanalyze={() => analyzeOne(c)}
                />
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

export default function AdminConflictsPage() {
  return (
    <Suspense>
      <AdminConflictsContent />
    </Suspense>
  );
}
