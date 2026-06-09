import { Options } from 'http-proxy-middleware';

export interface ServiceRoute {
  path: string;
  envKey: string;
  defaultUrl: string;
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
    path: '/api/programs',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — programmes',
  },
  {
    path: '/api/instructors',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — enseignants',
  },
  {
    path: '/api/students',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — étudiants',
  },
  {
    path: '/api/courses',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — cours',
  },
  {
    path: '/api/enrollments',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — inscriptions',
  },
  {
    path: '/api/schedules',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — plannings',
  },
  {
    path: '/api/rooms',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — salles',
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

export function buildProxyOptions(target: string, mountPath?: string): Options {
  return {
    target,
    changeOrigin: true,
    pathRewrite: mountPath ? (path) => `${mountPath}${path}` : undefined,
    cookieDomainRewrite: '',
    on: {
      proxyReq: (proxyReq, req) => {
        const auth = req.headers.authorization;
        if (auth) proxyReq.setHeader('Authorization', auth);
      },
    },
  };
}
