import { Options } from 'http-proxy-middleware';

/**
 * Configuration des routes du gateway vers les services métiers SOA.
 * Chaque entrée mappe un préfixe HTTP vers l'URL interne du service cible.
 */
export interface ServiceRoute {
  /** Préfixe de chemin (ex: /api/campus) */
  path: string;
  /** Variable d'environnement contenant l'URL du service */
  envKey: string;
  /** Valeur par défaut en développement local */
  defaultUrl: string;
  /** Description pédagogique */
  label: string;
}

export const SERVICE_ROUTES: ServiceRoute[] = [
  {
    path: '/api/auth',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — authentification',
  },
  {
    path: '/api/campus',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — campus',
  },
  {
    path: '/api/payments',
    envKey: 'BILLING_SERVICE_URL',
    defaultUrl: 'http://localhost:3003',
    label: 'Svc Facturation',
  },
  {
    path: '/api/notifications',
    envKey: 'NOTIFICATION_SERVICE_URL',
    defaultUrl: 'http://localhost:3004',
    label: 'Svc Notification',
  },
  {
    path: '/api/v1',
    envKey: 'AI_SERVICE_URL',
    defaultUrl: 'http://localhost:8000',
    label: 'Svc IA — relance financière',
  },
];

/** Options communes du reverse proxy HTTP */
export function buildProxyOptions(target: string): Options {
  return {
    target,
    changeOrigin: true,
    // Transmet les cookies et headers d'authentification au service cible
    cookieDomainRewrite: '',
    on: {
      proxyReq: (proxyReq, req) => {
        // Conserve le header Authorization pour les services protégés
        const auth = req.headers.authorization;
        if (auth) {
          proxyReq.setHeader('Authorization', auth);
        }
      },
    },
  };
}
