import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Acces refuse</h1>
      <p className="text-gray-600">
        Vous n&apos;avez pas les droits pour acceder a cette page.
      </p>
      <Link href="/login" className="text-blue-600 hover:underline">
        Retour a la connexion
      </Link>
    </main>
  );
}
