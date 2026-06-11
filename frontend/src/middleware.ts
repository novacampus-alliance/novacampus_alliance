/**
 * MIDDLEWARE Next.js = s'exécute AVANT chaque page.
 *
 * Imagine un vigile à l'entrée du site :
 * - Si tu n'as pas de badge (cookie) → direction la page login
 * - Si ton badge est faux/expiré → direction login aussi
 * - Si ton badge est bon mais tu vas au mauvais portail → accès refusé
 */

import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  canAccessRoute,
  isUserRole,
  JwtPayload,
  ROLE_HOME_PATH,
} from './lib/auth';

/** Pages accessibles sans être connecté */
const PUBLIC_PATHS = ['/', '/login', '/unauthorized'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true; // routes login/logout
  if (pathname.startsWith('/_next')) return true; // fichiers internes Next.js
  if (pathname.includes('.')) return true; // images, CSS, etc.
  return false;
}

/**
 * Vérifie que le JWT est valide (signature + expiration).
 * Utilise la librairie "jose" avec le même JWT_SECRET que le svc académique.
 */
async function verifyToken(token: string): Promise<JwtPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    const role = payload.role;
    if (typeof role !== 'string' || !isUserRole(role)) return null;

    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role,
      firstName: String(payload.firstName),
      lastName: String(payload.lastName),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    // Token expiré, modifié ou secret incorrect
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DEV UNIQUEMENT : permet de prévisualiser les portails sans backend ni login.
  // Ne s'active jamais en production (garde-fou sur NODE_ENV) et reste inactif
  // tant que DEV_AUTH_BYPASS n'est pas mis à "1" dans .env.local.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === '1'
  ) {
    return NextResponse.next();
  }

  // Pages publiques → laisser passer sans vérification.
  // Exception : un utilisateur déjà connecté qui arrive sur / ou /login est
  // renvoyé vers son portail (sinon il reverrait l'écran de connexion).
  if (isPublicPath(pathname)) {
    if (pathname === '/' || pathname === '/login') {
      const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
      if (token) {
        const user = await verifyToken(token);
        if (user) {
          return NextResponse.redirect(
            new URL(ROLE_HOME_PATH[user.role], request.url),
          );
        }
      }
    }
    return NextResponse.next();
  }

  // Lire le cookie httpOnly posé lors du login
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // Pas de cookie → rediriger vers /login en mémorisant la page demandée
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyToken(token);

  // Token invalide → supprimer le cookie et renvoyer au login
  if (!user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    return response;
  }

  // Bon token mais mauvais portail (ex: étudiant qui tente /admin)
  if (!canAccessRoute(user.role, pathname)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

/** Sur quelles URLs le middleware s'applique (presque toutes sauf assets statiques) */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
