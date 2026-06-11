'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card, StatCard } from '@/components/ui';
import {
  fetchAdminStudents,
  fetchPayments,
  fetchConflicts,
  fetchCourses,
} from '@/lib/api';
import { formatEUR, formatPercent } from '@/lib/format';
import type { AdminStudent, PaymentRow } from '@/lib/types';

export default function DirectionDashboardPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminStudents(),
      fetchPayments(),
      fetchConflicts(),
      fetchCourses(),
    ]).then(([s, p, c, courses]) => {
      setStudents(s);
      setPayments(p);
      setConflictCount(c.length);
      setCourseCount(courses.length);
      setLoading(false);
    });
  }, []);

  const activeStudents = students.filter((s) => s.status === 'ACTIF').length;

  const revenue = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const outstanding = payments
    .filter((p) => p.status !== 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectionRate =
    revenue + outstanding > 0 ? revenue / (revenue + outstanding) : 0;

  const byCampus = students.reduce<Record<string, number>>((acc, s) => {
    const name = s.campus && s.campus !== '—' ? s.campus : 'Non assigné';
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell title="Direction générale" subtitle="KPIs & rapports stratégiques">

      {/* KPIs principaux */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Étudiants actifs"
          value={loading ? '…' : String(activeStudents)}
        />
        <StatCard
          label="Chiffre encaissé"
          value={loading ? '…' : formatEUR(revenue)}
          tone="success"
        />
        <StatCard
          label="Encours impayés"
          value={loading ? '…' : formatEUR(outstanding)}
          tone={outstanding > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Taux de recouvrement"
          value={loading ? '…' : formatPercent(collectionRate)}
          tone={collectionRate > 0.8 ? 'success' : 'warning'}
        />
      </div>

      {/* KPIs secondaires */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Cours dispensés"
          value={loading ? '…' : String(courseCount)}
        />
        <StatCard
          label="Étudiants total"
          value={loading ? '…' : String(students.length)}
        />
        <Link href="/admin/conflits" className="block">
          <StatCard
            label="Conflits EDT actifs"
            value={loading ? '…' : String(conflictCount)}
            tone={conflictCount > 0 ? 'danger' : 'success'}
          />
        </Link>
      </div>

      {/* Répartition par campus */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Répartition des étudiants par campus
        </h3>
        {loading ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : Object.keys(byCampus).length === 0 ? (
          <p className="text-sm text-gray-500">Aucun étudiant trouvé.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byCampus)
              .sort((a, b) => b[1] - a[1])
              .map(([campus, count]) => {
                const pct = students.length ? count / students.length : 0;
                return (
                  <div key={campus}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{campus}</span>
                      <span className="text-gray-500">
                        {count} étudiant{count > 1 ? 's' : ''}{' '}
                        <span className="text-gray-400">
                          ({formatPercent(pct)})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-amber-700 transition-all duration-500"
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Résumé financier */}
      {!loading && (revenue + outstanding > 0) && (
        <Card className="mt-4 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Résumé financier
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Factures réglées', status: 'PAID', tone: 'success' },
              { label: 'En attente', status: 'PENDING', tone: 'warning' },
              { label: 'En retard', status: 'OVERDUE', tone: 'danger' },
            ].map(({ label, status, tone }) => {
              const rows = payments.filter((p) => p.status === status);
              if (rows.length === 0) return null;
              const total = rows.reduce((s, p) => s + p.amount, 0);
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        tone === 'success'
                          ? 'bg-emerald-500'
                          : tone === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                    />
                    <span className="text-gray-700">
                      {label}{' '}
                      <span className="text-gray-400">({rows.length})</span>
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {formatEUR(total)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
