/**
 * Session courante : décode le JWT du cookie httpOnly (aucun appel backend).
 *
 * Permet aux composants client de connaître l'utilisateur connecté
 * (id, email, rôle) sans exposer le token au JavaScript du navigateur.
 */

import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, isUserRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    return NextResponse.json({ message: 'Non authentifie' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const role = payload.role;
    if (typeof role !== 'string' || !isUserRole(role)) {
      return NextResponse.json({ message: 'Non authentifie' }, { status: 401 });
    }
    return NextResponse.json({
      id: String(payload.sub),
      email: String(payload.email ?? ''),
      role,
      firstName: String(payload.firstName ?? ''),
      lastName: String(payload.lastName ?? ''),
    });
  } catch {
    return NextResponse.json({ message: 'Non authentifie' }, { status: 401 });
  }
}
