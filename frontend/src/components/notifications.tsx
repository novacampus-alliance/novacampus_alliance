'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/icons';
import { fetchNotifications } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { UserRole } from '@/lib/auth';
import type { AppNotification, NotificationKind } from '@/lib/types';

const KIND_ICON: Record<NotificationKind, IconName> = {
  SCHEDULE: 'schedule',
  DEADLINE: 'history',
  GRADE: 'notes',
  PAYMENT: 'payments',
  CONFLICT: 'conflicts',
  REPORT: 'kpi',
};

/**
 * Les "lues" sont conservees en session : la cloche est remontee a chaque
 * page et les mocks repartiraient sinon de zero a chaque navigation.
 */
const READ_STORAGE_KEY = 'nc-notifications-read';

function loadReadIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(READ_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: string[]) {
  try {
    const merged = loadReadIds();
    ids.forEach((id) => merged.add(id));
    sessionStorage.setItem(
      READ_STORAGE_KEY,
      JSON.stringify(Array.from(merged)),
    );
  } catch {
    /* stockage indisponible : etat garde en memoire uniquement */
  }
}

/**
 * Cloche de notifications du header. Le contenu depend du role courant
 * (etudiant : changements de planning et echeances, enseignant : saisies et
 * salles, admin : paiements et conflits, direction : rapports).
 */
export function NotificationsBell({ role }: { role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications(role).then((list) => {
      const read = loadReadIds();
      setItems(list.map((n) => (read.has(n.id) ? { ...n, read: true } : n)));
    });
  }, [role]);

  // Fermeture au clavier (Echap, focus rendu au bouton) et au clic exterieur.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  // A l'ouverture, le focus entre dans le panneau (lecture/tabulation logiques).
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  function markRead(id: string) {
    persistReadIds([id]);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function openNotification(n: AppNotification) {
    markRead(n.id);
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  }

  function markAllRead() {
    persistReadIds(items.map((n) => n.id));
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0
            ? `Notifications — ${unread} non lue${unread > 1 ? 's' : ''}`
            : 'Notifications — aucune non lue'
        }
        aria-expanded={open}
        aria-controls={open ? 'nc-notifications-panel' : undefined}
        className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-500 p-2 text-gray-800 hover:bg-gray-100"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-amber-700 bg-brand-400 px-1 text-[11px] font-bold text-zinc-950"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="nc-notifications-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className="absolute right-0 top-full z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-gray-300 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              className="min-h-11 rounded-md px-2 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950 disabled:text-gray-600 disabled:no-underline"
            >
              Tout marquer comme lu
            </button>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-600">
              Aucune notification.
            </p>
          ) : (
            <ul className="nc-scroll max-h-[min(24rem,60vh)] overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openNotification(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      n.read ? '' : 'bg-brand-50'
                    }`}
                  >
                    <Icon
                      name={KIND_ICON[n.kind]}
                      className="mt-0.5 h-5 w-5 text-gray-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-700/40">
                            Non lue
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-gray-700">
                        {n.detail}
                      </span>
                      <span className="mt-1 block text-xs text-gray-600">
                        {formatDate(n.date)} · {formatTime(n.date)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
