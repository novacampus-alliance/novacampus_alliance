/**
 * Route API Next.js : POST /api/auth/logout
 *
 * La déconnexion = supprimer le cookie qui contient le JWT.
 * Sans cookie, le middleware bloquera l'accès aux pages protégées.
 */

import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Deconnexion reussie' });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  return response;
}
