/**
 * Configuration de la navigation laterale par portail (role).
 * Chaque portail a des groupes de liens, un libelle et un profil de demo.
 */

import { UserRole } from './auth';

export interface NavLink {
  href: string;
  label: string;
  icon: string; // emoji simple pour rester sans dependance d'icones
  badge?: number;
}

export interface NavGroup {
  title?: string;
  links: NavLink[];
}

export interface PortalConfig {
  role: UserRole;
  brand: string;
  brandSub: string;
  groups: NavGroup[];
  profile: { name: string; subtitle: string };
}

export const STUDENT_CONFIG: PortalConfig = {
  role: 'STUDENT',
  brand: 'NovaCampus',
  brandSub: 'Espace Etudiant',
  profile: { name: 'Alice Martin', subtitle: 'Etudiant · L3 INFO · Paris' },
  groups: [
    {
      links: [
        { href: '/etudiant', label: 'Tableau de bord', icon: '🏠' },
        { href: '/etudiant/planning', label: 'Emploi du temps', icon: '🗓️' },
      ],
    },
    {
      title: 'Scolarite',
      links: [
        { href: '/etudiant/notes', label: 'Notes', icon: '📊' },
        { href: '/etudiant/releve', label: 'Releve', icon: '📄' },
        { href: '/etudiant/factures', label: 'Factures', icon: '💳' },
      ],
    },
  ],
};

export const TEACHER_CONFIG: PortalConfig = {
  role: 'INSTRUCTOR',
  brand: 'NovaCampus',
  brandSub: 'Espace Enseignant',
  profile: { name: 'Marie Dupont', subtitle: 'Enseignant · Paris' },
  groups: [
    {
      links: [
        { href: '/enseignant', label: 'Tableau de bord', icon: '🏠' },
        { href: '/enseignant/cours', label: 'Mes cours', icon: '📚' },
        { href: '/enseignant/planning', label: 'Emploi du temps', icon: '🗓️' },
      ],
    },
  ],
};

export const ADMIN_CONFIG: PortalConfig = {
  role: 'ADMIN',
  brand: 'NovaCampus',
  brandSub: 'ERP Academique',
  profile: { name: 'Sophie Lefebvre', subtitle: 'Administration · Paris' },
  groups: [
    {
      title: 'Gestion',
      links: [
        { href: '/admin', label: 'Tableau de bord', icon: '📈' },
        { href: '/admin/etudiants', label: 'Etudiants', icon: '🎓' },
        { href: '/admin/inscriptions', label: 'Inscriptions', icon: '📝' },
        { href: '/admin/paiements', label: 'Paiements', icon: '💳', badge: 3 },
      ],
    },
    {
      title: 'Planning',
      links: [
        { href: '/admin/plannings', label: 'Emplois du temps', icon: '🗓️' },
        { href: '/admin/salles', label: 'Gestion des salles', icon: '🏛️' },
        { href: '/admin/conflits', label: 'Conflits', icon: '⚠️', badge: 1 },
      ],
    },
  ],
};

export const DIRECTION_CONFIG: PortalConfig = {
  role: 'DIRECTION',
  brand: 'NovaCampus',
  brandSub: 'Direction',
  profile: { name: 'Jean Moreau', subtitle: 'Direction · Siege' },
  groups: [
    {
      links: [
        { href: '/direction', label: 'Tableau de bord', icon: '📈' },
      ],
    },
  ],
};

export const PORTAL_BY_PREFIX: { prefix: string; config: PortalConfig }[] = [
  { prefix: '/etudiant', config: STUDENT_CONFIG },
  { prefix: '/enseignant', config: TEACHER_CONFIG },
  { prefix: '/admin', config: ADMIN_CONFIG },
  { prefix: '/direction', config: DIRECTION_CONFIG },
];

export function configForPath(pathname: string): PortalConfig {
  const match = PORTAL_BY_PREFIX.find(
    (p) => pathname === p.prefix || pathname.startsWith(p.prefix + '/'),
  );
  return match?.config ?? STUDENT_CONFIG;
}

/** Bascule de portail affichee en bas de la barre laterale (demo/multi-role). */
export const ROLE_SWITCHER: { label: string; href: string; role: UserRole }[] = [
  { label: 'Etudiant', href: '/etudiant', role: 'STUDENT' },
  { label: 'Prof.', href: '/enseignant', role: 'INSTRUCTOR' },
  { label: 'Admin', href: '/admin', role: 'ADMIN' },
  { label: 'Direction', href: '/direction', role: 'DIRECTION' },
];
