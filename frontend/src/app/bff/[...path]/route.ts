/**
 * Proxy BFF (Backend For Frontend) : /bff/<chemin> → gateway /api/<chemin>.
 *
 * Pourquoi ? Le JWT est stocké dans un cookie httpOnly (invisible du JS
 * navigateur) alors que le gateway n'accepte que `Authorization: Bearer`.
 * Cette route lit le cookie côté serveur Next.js et relaie la requête avec
 * le header attendu. Le frontend n'appelle ainsi QUE les endpoints déclarés
 * de la plateforme (collection Postman), via ce relais transparent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

export const dynamic = 'force-dynamic';

async function proxy(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const target = `${API_URL}/api/${params.path.join('/')}${request.nextUrl.search}`;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const headers: Record<string, string> = {};
  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let backendRes: Response;
  try {
    backendRes = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'Gateway injoignable' },
      { status: 502 },
    );
  }

  const body = await backendRes.text();
  return new NextResponse(body, {
    status: backendRes.status,
    headers: {
      'Content-Type':
        backendRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
