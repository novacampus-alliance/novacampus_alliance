/**
 * Route API Next.js : POST /api/auth/logout
 *
 * 1. Révoque le JWT côté serveur (liste noire Redis via le gateway → svc académique)
 * 2. Supprime le cookie httpOnly côté navigateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // Révocation serveur si un token est présent
  if (token) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // On supprime le cookie même si le gateway est injoignable
    });
  }

  const response = NextResponse.json({ message: 'Deconnexion reussie' });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  return response;
}
