'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, StatCard } from '@/components/ui';
import { fetchAdminStudents, fetchPayments } from '@/lib/api';
import { formatEUR, formatPercent } from '@/lib/format';
import type { AdminStudent, PaymentRow } from '@/lib/types';

export default function DirectionDashboardPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    fetchAdminStudents().then(setStudents);
    fetchPayments().then(setPayments);
  }, []);

  const activeStudents = students.filter((s) => s.status === 'ACTIF').length;
  const revenue = payments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = payments
    .filter((p) => p.status !== 'PAID')
    .reduce((s, p) => s + p.amount, 0);
  const collectionRate =
    revenue + outstanding > 0 ? revenue / (revenue + outstanding) : 0;

  const byCampus = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.campus] = (acc[s.campus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell title="Direction" subtitle="KPIs & rapports strategiques">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Etudiants actifs" value={String(activeStudents)} />
        <StatCard label="Chiffre encaisse" value={formatEUR(revenue)} tone="success" />
        <StatCard label="Encours" value={formatEUR(outstanding)} tone="warning" />
        <StatCard
          label="Taux de recouvrement"
          value={formatPercent(collectionRate)}
          tone={collectionRate > 0.8 ? 'success' : 'warning'}
        />
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Repartition par campus
        </h3>
        <div className="space-y-3">
          {Object.entries(byCampus).map(([campus, count]) => {
            const pct = students.length ? count / students.length : 0;
            return (
              <div key={campus}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{campus}</span>
                  <span className="text-gray-600">{count} etudiants</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-amber-700"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {students.length === 0 && (
            <p className="text-sm text-gray-600">Chargement...</p>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
