/**
 * Route API Next.js : POST /api/auth/login
 *
 * Pourquoi une route intermédiaire au lieu d'appeler NestJS directement depuis le navigateur ?
 * → Pour stocker le JWT dans un cookie httpOnly (plus sécurisé que localStorage).
 * Le navigateur ne peut pas lire un cookie httpOnly, ce qui protège contre le vol de token via XSS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, ROLE_HOME_PATH, UserRole } from '@/lib/auth';

const API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 1. Transmettre email + password au gateway → svc académique.
  // Gateway injoignable ou réponse illisible → 502 JSON propre plutôt
  // qu'une 500 HTML que le client ne saurait pas parser.
  let backendRes: Response;
  let data: { user?: { role?: string }; access_token?: string; message?: string };
  try {
    backendRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    data = await backendRes.json();
  } catch {
    return NextResponse.json(
      { message: 'Service d’authentification injoignable' },
      { status: 502 },
    );
  }

  // 2. Si l'API refuse (mauvais identifiants) → renvoyer l'erreur au frontend
  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  // 3. Déterminer vers quel portail rediriger selon le rôle
  const role = data.user?.role as UserRole | undefined;
  if (!role || !data.access_token) {
    return NextResponse.json(
      { message: 'Réponse du service d’authentification invalide' },
      { status: 502 },
    );
  }
  const redirectTo = ROLE_HOME_PATH[role] ?? '/';

  // 4. Poser le JWT dans un cookie httpOnly
  const response = NextResponse.json({ user: data.user, redirectTo });
  response.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, {
    httpOnly: true, // JavaScript ne peut pas lire ce cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
    sameSite: 'lax', // Protection CSRF basique
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours en secondes
  });

  return response;
}
