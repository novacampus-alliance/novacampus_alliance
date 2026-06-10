'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, StatCard, StatusPill } from '@/components/ui';
import { formatPercent } from '@/lib/format';

interface Room {
  id: string;
  name: string;
  campus: string;
  capacity: number;
  type: 'Amphi' | 'Salle TD' | 'Salle TP' | 'Labo';
  occupancy: number; // 0..1 sur la semaine
}

const ROOMS: Room[] = [
  { id: 'r-a204', name: 'A204', campus: 'Paris', capacity: 32, type: 'Salle TD', occupancy: 0.78 },
  { id: 'r-a210', name: 'A210', campus: 'Paris', capacity: 32, type: 'Salle TD', occupancy: 0.45 },
  { id: 'r-amph1', name: 'Amphi 1', campus: 'Paris', capacity: 120, type: 'Amphi', occupancy: 0.62 },
  { id: 'r-b105', name: 'B105', campus: 'Paris', capacity: 28, type: 'Salle TP', occupancy: 0.9 },
  { id: 'r-l1', name: 'Labo Info 1', campus: 'Lyon', capacity: 24, type: 'Labo', occupancy: 0.55 },
  { id: 'r-c310', name: 'C310', campus: 'Lyon', capacity: 35, type: 'Salle TD', occupancy: 0.3 },
  { id: 'r-t1', name: 'Hangar T1', campus: 'Toulouse', capacity: 40, type: 'Labo', occupancy: 0.48 },
];

export default function AdminRoomsPage() {
  const [campus, setCampus] = useState('ALL');

  const campuses = useMemo(
    () => Array.from(new Set(ROOMS.map((r) => r.campus))).sort(),
    [],
  );

  const filtered = ROOMS.filter((r) => campus === 'ALL' || r.campus === campus);
  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const avgOccupancy = filtered.length
    ? filtered.reduce((s, r) => s + r.occupancy, 0) / filtered.length
    : 0;

  return (
    <AppShell
      title="Gestion des salles"
      subtitle="Capacites & occupation"
      actions={
        <select
          aria-label="Filtrer par campus"
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        >
          <option value="ALL">Tous les campus</option>
          {campuses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Salles" value={String(filtered.length)} />
        <StatCard label="Capacite totale" value={String(totalCapacity)} />
        <StatCard
          label="Occupation moyenne"
          value={formatPercent(avgOccupancy)}
          tone={avgOccupancy > 0.8 ? 'danger' : 'success'}
        />
      </div>

      <Card className="overflow-x-auto">
        <table aria-label="Salles et occupation" className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3">Salle</th>
              <th scope="col" className="px-4 py-3">Campus</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Capacite</th>
              <th scope="col" className="px-4 py-3">Occupation</th>
              <th scope="col" className="px-4 py-3">Etat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.campus}</td>
                <td className="px-4 py-3 text-gray-600">{r.type}</td>
                <td className="px-4 py-3 text-gray-700">{r.capacity}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded bg-gray-100">
                      <div
                        className={`h-full ${
                          r.occupancy > 0.85
                            ? 'bg-red-600'
                            : r.occupancy > 0.6
                              ? 'bg-amber-700'
                              : 'bg-emerald-700'
                        }`}
                        style={{ width: `${r.occupancy * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {formatPercent(r.occupancy)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {r.occupancy > 0.85 ? (
                    <StatusPill tone="danger">Saturee</StatusPill>
                  ) : r.occupancy > 0.6 ? (
                    <StatusPill tone="warning">Chargee</StatusPill>
                  ) : (
                    <StatusPill tone="success">Disponible</StatusPill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
