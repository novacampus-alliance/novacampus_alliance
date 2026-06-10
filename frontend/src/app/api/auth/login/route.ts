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

  // 1. Transmettre email + password au gateway → svc académique
  const backendRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  // 2. Si l'API refuse (mauvais identifiants) → renvoyer l'erreur au frontend
  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  // 3. Déterminer vers quel portail rediriger selon le rôle
  const role = data.user.role as UserRole;
  const redirectTo = ROLE_HOME_PATH[role] ?? '/';

  // 4. Poser le JWT dans un cookie httpOnly (+ access_token pour Postman / clients API)
  const response = NextResponse.json({
    user: data.user,
    redirectTo,
    access_token: data.access_token,
  });
  response.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, {
    httpOnly: true, // JavaScript ne peut pas lire ce cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
    sameSite: 'lax', // Protection CSRF basique
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours en secondes
  });

  return response;
}
