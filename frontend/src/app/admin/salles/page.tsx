'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, StatCard, StatusPill } from '@/components/ui';
import { fetchRooms } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { Room } from '@/lib/types';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [campus, setCampus] = useState('ALL');
  const [type, setType] = useState('ALL');

  useEffect(() => {
    fetchRooms().then(setRooms);
  }, []);

  const campuses = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.campus))).sort(),
    [rooms],
  );

  const types = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.type))).sort(),
    [rooms],
  );

  const filtered = rooms.filter(
    (r) =>
      (campus === 'ALL' || r.campus === campus) &&
      (type === 'ALL' || r.type === type),
  );

  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const avgOccupancy = filtered.length
    ? filtered.reduce((s, r) => s + r.occupancy, 0) / filtered.length
    : 0;
  const saturated = filtered.filter((r) => r.occupancy > 0.85).length;

  return (
    <AppShell
      title="Gestion des salles"
      subtitle="Capacités & occupation"
      actions={
        <div className="flex items-center gap-2">
          <select
            aria-label="Filtrer par campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="ALL">Tous les campus</option>
            {campuses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filtrer par type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="min-h-11 rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm focus:border-amber-700"
          >
            <option value="ALL">Tous les types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard label="Salles" value={String(filtered.length)} />
        <StatCard label="Capacité totale" value={String(totalCapacity)} />
        <StatCard
          label="Occupation moyenne"
          value={formatPercent(avgOccupancy)}
          tone={avgOccupancy > 0.8 ? 'danger' : 'success'}
        />
        <StatCard
          label="Saturées"
          value={String(saturated)}
          tone={saturated > 0 ? 'danger' : 'success'}
        />
      </div>

      <Card className="overflow-x-auto">
        <table aria-label="Salles et occupation" className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3">Salle</th>
              <th scope="col" className="px-4 py-3">Campus</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Capacité</th>
              <th scope="col" className="px-4 py-3">Occupation</th>
              <th scope="col" className="px-4 py-3">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  Aucune salle trouvée.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
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
                      <StatusPill tone="danger">Saturée</StatusPill>
                    ) : r.occupancy > 0.6 ? (
                      <StatusPill tone="warning">Chargée</StatusPill>
                    ) : (
                      <StatusPill tone="success">Disponible</StatusPill>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
