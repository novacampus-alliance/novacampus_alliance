'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui';
import { fetchTranscript } from '@/lib/api';
import {
  COURSE_STATUS_BADGE,
  COURSE_STATUS_LABEL,
  formatPercent,
} from '@/lib/format';
import type { TranscriptEntry } from '@/lib/types';

export default function StudentTranscriptPage() {
  const [transcript, setTranscript] = useState<TranscriptEntry[] | null>(null);

  useEffect(() => {
    fetchTranscript().then(setTranscript);
  }, []);

  const totalEcts = transcript?.reduce((s, t) => s + t.ectsEarned, 0) ?? 0;
  const generalAverage =
    transcript && transcript.length
      ? transcript.reduce((s, t) => s + t.averageGrade, 0) / transcript.length
      : 0;

  return (
    <AppShell title="Relevé académique" subtitle="Historique complet">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-gray-600">
          Toutes les notes obtenues semestre par semestre.
        </p>
        <Button onClick={() => window.print()}>📄 Exporter en PDF</Button>
      </div>

      {transcript === null ? (
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      ) : transcript.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Aucun relevé disponible pour le moment.
        </p>
      ) : (
        <div id="transcript" className="space-y-6">
          <header className="hidden print:block">
            <h1 className="text-2xl font-bold">Relevé académique</h1>
            <p className="text-sm text-gray-600">
              Généré le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </header>

          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Moyenne générale" value={generalAverage.toFixed(2)} />
            <SummaryCard label="ECTS cumulés" value={String(totalEcts)} />
            <SummaryCard label="Semestres" value={String(transcript.length)} />
          </section>

          {transcript.map((entry) => (
            <section
              key={entry.semester}
              className="overflow-hidden rounded-lg border bg-white print:border-0"
            >
              <header className="flex items-center justify-between border-b bg-gray-50 px-4 py-2 print:bg-white">
                <div>
                  <h3 className="text-base font-semibold">Semestre {entry.semester}</h3>
                  <p className="text-xs text-gray-600">
                    Moyenne : {entry.averageGrade.toFixed(2)} — ECTS : {entry.ectsEarned}
                  </p>
                </div>
              </header>
              <table
                aria-label={`Notes du semestre ${entry.semester}`}
                className="min-w-full divide-y divide-gray-100 text-sm"
              >
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 print:bg-white">
                  <tr>
                    <th scope="col" className="px-4 py-2">Code</th>
                    <th scope="col" className="px-4 py-2">Cours</th>
                    <th scope="col" className="px-4 py-2">ECTS</th>
                    <th scope="col" className="px-4 py-2">Note</th>
                    <th scope="col" className="px-4 py-2">Présence</th>
                    <th scope="col" className="px-4 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entry.courses.map((c) => (
                    <tr key={c.courseId}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">
                        {c.courseCode}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900">{c.courseName}</td>
                      <td className="px-4 py-2">{c.ects}</td>
                      <td className="px-4 py-2">
                        {c.finalGrade != null
                          ? `${c.finalGrade.toFixed(1)} / ${c.maxGrade}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2">{formatPercent(c.attendanceRate)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${COURSE_STATUS_BADGE[c.status]}`}
                        >
                          {COURSE_STATUS_LABEL[c.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          <p className="text-xs text-gray-600 print:mt-8">
            Novacampus Alliance — Document généré pour usage interne.
          </p>
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
