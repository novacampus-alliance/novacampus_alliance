import { redirect } from 'next/navigation';

/**
 * Racine du site : aucun contenu propre. Les visiteurs connectes sont
 * rediriges vers leur portail par le middleware ; les autres vers le login.
 */
export default function Home() {
  redirect('/login');
}
