import { Options } from 'http-proxy-middleware';

/**
 * Configuration des routes du gateway vers les services mÃ©tiers SOA.
 * Chaque entrÃ©e mappe un prÃ©fixe HTTP vers l'URL interne du service cible.
 */
export interface ServiceRoute {
  /** PrÃ©fixe de chemin (ex: /api/campus) */
  path: string;
  /** Variable d'environnement contenant l'URL du service */
  envKey: string;
  /** Valeur par dÃ©faut en dÃ©veloppement local */
  defaultUrl: string;
  /** Description pÃ©dagogique */
  label: string;
}

export const SERVICE_ROUTES: ServiceRoute[] = [
  {
    path: '/api/auth',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc AcadÃ©mique â€” authentification',
  },
  {
    path: '/api/campus',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc AcadÃ©mique â€” campus',
  },
  {
    path: '/api/programs',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc AcadÃ©mique â€” programmes',
  },
  {
    path: '/api/courses',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — cours',
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
    label: 'Svc IA â€” relance financiÃ¨re',
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
        // Conserve le header Authorization pour les services protÃ©gÃ©s
        const auth = req.headers.authorization;
        if (auth) {
          proxyReq.setHeader('Authorization', auth);
        }
      },
    },
  };
}
