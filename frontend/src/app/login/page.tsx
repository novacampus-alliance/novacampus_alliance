'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogoFull } from '@/components/logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : (data.message ?? 'Connexion echouee');
        setError(message);
        return;
      }

      // Seuls les chemins internes sont acceptes : un lien forge du type
      // /login?redirect=https://evil.com ne doit pas sortir du site.
      const requested = searchParams.get('redirect');
      const isInternalPath =
        requested?.startsWith('/') && !requested.startsWith('//');
      router.push((isInternalPath ? requested : data.redirectTo) ?? '/');
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-h-11 rounded-lg border border-gray-500 px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
          placeholder="etudiant@novacampus.fr"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full min-h-11 rounded-lg border border-gray-500 px-3 py-2 text-sm placeholder:text-gray-600 focus:border-amber-700"
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-11 rounded-lg border border-brand-700 bg-brand-400 py-2 text-sm font-semibold text-zinc-950 hover:bg-brand-300 disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <LogoFull className="mb-4 h-12 w-auto" />
        <h1 className="mb-6 text-sm font-normal text-gray-600">
          Connexion a votre portail
        </h1>

        <Suspense fallback={<p className="text-sm text-gray-600">Chargement...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
