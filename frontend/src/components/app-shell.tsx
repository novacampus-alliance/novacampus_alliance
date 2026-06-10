'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  configForPath,
  PORTAL_BY_PREFIX,
  ROLE_SWITCHER,
} from '@/lib/nav-config';
import { Avatar } from '@/components/ui';
import { LogoMark } from '@/components/logo';

interface AppShellProps {
  title: string;
  subtitle?: string;
  /** Contenu du rail de droite (alertes, agent IA, etc.) */
  aside?: React.ReactNode;
  /** Actions affichees en haut a droite de la zone de contenu */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  title,
  subtitle,
  aside,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const config = configForPath(pathname);
  const portalPrefix =
    PORTAL_BY_PREFIX.find((p) => p.config.role === config.role)?.prefix ?? '/';

  // Fermeture du volet mobile au clavier (Echap).
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string): boolean {
    if (pathname === href) return true;
    return href !== portalPrefix && pathname.startsWith(href + '/');
  }

  const sidebar = (
    <div data-dark="true" className="flex h-full flex-col bg-sidebar text-zinc-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark className="h-9 w-9 shrink-0" />
        <div className="leading-tight">
          <div className="text-base font-extrabold tracking-tight">
            <span className="text-brand-400">Nova</span>
            <span className="text-white">Campus</span>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-sidebar-muted">
            {config.brandSub}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navigation principale"
        className="nc-scroll flex-1 overflow-y-auto px-3 py-2"
      >
        {config.groups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.title && (
              <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
                {group.title}
              </div>
            )}
            <ul className="space-y-1">
              {group.links.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-brand-400 font-bold text-zinc-950'
                          : 'font-medium text-zinc-200 hover:bg-sidebar-hover hover:text-white'
                      }`}
                    >
                      <span aria-hidden="true" className="text-base">
                        {link.icon}
                      </span>
                      <span className="flex-1">{link.label}</span>
                      {link.badge != null && (
                        <span
                          className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                            active
                              ? 'bg-zinc-950 text-brand-400'
                              : 'bg-brand-400 text-zinc-950'
                          }`}
                        >
                          {link.badge}
                          <span className="sr-only"> en attente</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bascule de portail */}
      <nav
        aria-label="Changer de portail"
        className="border-t border-sidebar-border px-3 py-3"
      >
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-800/60 p-1">
          {ROLE_SWITCHER.map((r) => {
            const current = r.role === config.role;
            return (
              <Link
                key={r.role}
                href={r.href}
                onClick={() => setMobileOpen(false)}
                aria-current={current ? 'true' : undefined}
                className={`rounded-md px-1 py-1.5 text-center text-[11px] font-semibold transition-colors ${
                  current
                    ? 'bg-brand-400 text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profil / deconnexion */}
      <button
        onClick={handleLogout}
        aria-label={`Se deconnecter — ${config.profile.name}`}
        className="flex min-h-11 items-center gap-3 border-t border-sidebar-border px-4 py-3 text-left transition-colors hover:bg-sidebar-hover"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-zinc-950"
        >
          {config.profile.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {config.profile.name}
          </span>
          <span className="block truncate text-[11px] text-sidebar-muted">
            {config.profile.subtitle}
          </span>
        </span>
        <span aria-hidden="true" className="text-sidebar-muted">
          ⏻
        </span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Lien d'evitement (navigation clavier) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-950 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-brand-300"
      >
        Aller au contenu principal
      </a>

      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="fixed inset-y-0 left-0 w-64">{sidebar}</div>
      </aside>

      {/* Sidebar mobile (volet) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="nc-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            className="absolute inset-y-0 left-0 w-64"
          >
            {sidebar}
          </div>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-gray-800 hover:bg-gray-100 md:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              aria-controls="nc-mobile-menu"
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-baseline gap-2 truncate">
                <span className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
                  {title}
                </span>
                {subtitle && (
                  <span className="hidden truncate text-sm text-gray-600 sm:inline">
                    · {subtitle}
                  </span>
                )}
              </h1>
            </div>

            <div className="hidden items-center rounded-lg border border-gray-500 bg-white px-3 py-1.5 text-sm lg:flex">
              <span aria-hidden="true" className="mr-2">
                🔍
              </span>
              <input
                type="search"
                aria-label="Rechercher dans le portail"
                placeholder="Rechercher..."
                className="w-40 bg-transparent text-gray-900 outline-none placeholder:text-gray-600"
              />
            </div>

            <button
              className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-500 p-2 text-gray-800 hover:bg-gray-100"
              aria-label="Notifications — 1 non lue"
            >
              <span aria-hidden="true">🔔</span>
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600"
              />
            </button>

            <Avatar name={config.profile.name} />
          </div>
        </header>

        {/* Contenu + rail */}
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
            {actions && (
              <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                {actions}
              </div>
            )}
            {children}
          </main>
          {aside && (
            <aside
              aria-label="Informations complementaires"
              className="w-full shrink-0 space-y-4 lg:w-80"
            >
              {aside}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
