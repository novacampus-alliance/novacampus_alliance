/**
 * Briques d'interface reutilisables (style NovaCampus).
 * Avatar a initiales, pastilles de statut, badges de filiere, cartes, boutons.
 *
 * Contrastes verifies pour WCAG 2.1 AAA :
 * - texte sur fond clair : >= 7:1 (teintes *-800/900 sur *-50/100) ;
 * - texte sombre sur jaune marque : ~12:1 ;
 * - bordures de champs/boutons : >= 3:1 face au fond adjacent (1.4.11).
 */

import Link from 'next/link';
import { InvoiceStatus } from '@/lib/types';

/* ----------------------------- Avatar ----------------------------- */

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-900',
  'bg-amber-100 text-amber-900',
  'bg-emerald-100 text-emerald-900',
  'bg-sky-100 text-sky-900',
  'bg-violet-100 text-violet-900',
  'bg-orange-100 text-orange-900',
  'bg-teal-100 text-teal-900',
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-xs';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${dim} ${colorFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}

/* --------------------------- Status pill --------------------------- */

export function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}) {
  const styles: Record<typeof tone, string> = {
    success: 'bg-emerald-50 text-emerald-900 ring-emerald-700/40',
    warning: 'bg-amber-50 text-amber-900 ring-amber-700/40',
    danger: 'bg-red-50 text-red-900 ring-red-700/40',
    info: 'bg-sky-50 text-sky-900 ring-sky-700/40',
    neutral: 'bg-gray-100 text-gray-800 ring-gray-500/40',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function PaymentStatusPill({ status }: { status: InvoiceStatus }) {
  if (status === 'PAID')
    return (
      <StatusPill tone="success">
        <span aria-hidden="true">✓</span> A jour
      </StatusPill>
    );
  if (status === 'PENDING')
    return (
      <StatusPill tone="warning">
        <span aria-hidden="true">⏳</span> En attente
      </StatusPill>
    );
  return (
    <StatusPill tone="danger">
      <span aria-hidden="true">⚠</span> Retard
    </StatusPill>
  );
}

/* --------------------------- Filiere badge ------------------------- */

const FILIERE_COLORS: Record<string, string> = {
  Commerce: 'bg-indigo-50 text-indigo-900',
  Informatique: 'bg-cyan-50 text-cyan-900',
  Aerospatial: 'bg-purple-50 text-purple-900',
  Aérospatial: 'bg-purple-50 text-purple-900',
};

export function FiliereBadge({ label }: { label: string }) {
  const cls = FILIERE_COLORS[label] ?? 'bg-gray-100 text-gray-800';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

/* ------------------------------ Card ------------------------------- */

export function Card({
  children,
  className = '',
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      data-dark={dark ? 'true' : undefined}
      className={`rounded-xl border shadow-sm ${
        dark
          ? 'border-zinc-700 bg-sidebar text-white'
          : 'border-gray-200 bg-white'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`text-xs font-semibold uppercase tracking-wider text-gray-600 ${className}`}
    >
      {children}
    </h3>
  );
}

/* ----------------------------- Button ------------------------------ */

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
};

function buttonClasses(variant: ButtonProps['variant'], size: ButtonProps['size']) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  // md vise une cible >= 44px (2.5.5) ; sm reste pour les zones denses.
  const sizing =
    size === 'sm' ? 'min-h-9 px-3 py-1.5 text-xs' : 'min-h-11 px-4 py-2.5 text-sm';
  const variants = {
    // Jaune logo + texte quasi noir (12:1). La bordure or sombre donne
    // une limite de composant > 3:1 face au blanc ET face au jaune.
    primary:
      'border border-brand-700 bg-brand-400 text-zinc-950 hover:bg-brand-300',
    secondary:
      'border border-gray-500 bg-white text-gray-900 hover:bg-gray-100',
    ghost: 'text-gray-800 hover:bg-gray-100',
    danger: 'bg-red-800 text-white hover:bg-red-900',
  } as const;
  return `${base} ${sizing} ${variants[variant ?? 'primary']}`;
}

export function Button({
  variant,
  size,
  className = '',
  onClick,
  disabled,
  type = 'button',
  children,
}: ButtonProps & {
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClasses(variant, size)} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className = '',
  href,
  children,
}: ButtonProps & { href: string }) {
  return (
    <Link href={href} className={`${buttonClasses(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}

/* ------------------------------ KPI -------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const accent = {
    neutral: 'text-gray-900',
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    danger: 'text-red-800',
  }[tone];
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-gray-600">{hint}</div>}
    </Card>
  );
}
