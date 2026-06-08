/**
 * Fichier utilitaire partagé pour l'authentification côté frontend.
 * Contient les types, constantes et fonctions utilisées par le middleware et les pages.
 */

/** Les 4 rôles possibles dans l'application */
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'DIRECTION';

/** Nom du cookie qui stocke le JWT (httpOnly = invisible pour le JavaScript du navigateur) */
export const ACCESS_TOKEN_COOKIE = 'access_token';

/** Page d'accueil de chaque rôle après connexion */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  STUDENT: '/etudiant',
  INSTRUCTOR: '/enseignant',
  ADMIN: '/admin',
  DIRECTION: '/direction',
};

/** Préfixe d'URL autorisé pour chaque rôle */
export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  STUDENT: '/etudiant',
  INSTRUCTOR: '/enseignant',
  ADMIN: '/admin',
  DIRECTION: '/direction',
};

/** Labels affichés dans l'interface */
export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Etudiant',
  INSTRUCTOR: 'Enseignant',
  ADMIN: 'Administration',
  DIRECTION: 'Direction',
};

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

/** Contenu décodé du JWT */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  iat?: number; // issued at = date de création du token
  exp?: number; // expiration = date d'expiration du token
}

/** Vérifie qu'une chaîne est bien un rôle valide */
export function isUserRole(value: string): value is UserRole {
  return ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'DIRECTION'].includes(value);
}

/**
 * Vérifie si un rôle a le droit d'accéder à une URL.
 * Exemple : un STUDENT peut aller sur /etudiant/notes mais PAS sur /admin
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const prefix = ROLE_ROUTE_PREFIX[role];
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
