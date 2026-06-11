import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';
import { buildProxyOptions, SERVICE_ROUTES } from './proxy/proxy.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Gateway');

  const academicUrl = process.env.ACADEMIC_SERVICE_URL  ?? 'http://localhost:3002';
  const billingUrl  = process.env.BILLING_SERVICE_URL   ?? 'http://localhost:3003';
  const notifUrl    = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3004';
  const aiUrl       = process.env.AI_SERVICE_URL        ?? 'http://localhost:8000';

  // ── Swagger agrégé — enregistré via SwaggerModule AVANT app.listen() ─────────
  // SwaggerModule.setup() enregistre ses routes via le système NestJS natif,
  // ce qui leur donne la priorité sur les proxies express ajoutés après.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Novacampus Alliance — API Docs')
    .setDescription(
      'Documentation unifiée SOA — sélectionnez un service dans la liste déroulante.\n\n'
      + '| Service | Contenu |\n'
      + '|---------|--------|\n'
      + '| Academic | Auth, campus, EDT, conflits, inscriptions |\n'
      + '| Billing | Paiements, factures |\n'
      + '| Notification | Alertes email / push |\n'
      + '| AI Service | Agent M7 — résolution conflits EDT |',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    explorer: true,
    customSiteTitle: 'Novacampus Alliance — API Docs',
    swaggerOptions: {
      urls: [
        { url: '/api/academic-spec', name: 'Academic Service' },
        { url: '/api/billing-spec',  name: 'Billing Service'  },
        { url: '/api/notif-spec',    name: 'Notification Service' },
        { url: '/api/ai-spec',       name: 'AI Service — Agent Conflits EDT' },
      ],
      urls_primary_name: 'Academic Service',
      persistAuthorization: true,
    },
  });

  // ── Proxies pour les specs OpenAPI JSON de chaque service ────────────────────
  // Ces routes doivent être enregistrées AVANT le catch-all /api.
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use(
    createProxyMiddleware({
      target: academicUrl,
      changeOrigin: true,
      pathFilter: '/api/academic-spec',
      pathRewrite: { '^/api/academic-spec': '/api/docs-json' },
    }),
  );
  expressApp.use(
    createProxyMiddleware({
      target: billingUrl,
      changeOrigin: true,
      pathFilter: '/api/billing-spec',
      pathRewrite: { '^/api/billing-spec': '/api/docs-json' },
    }),
  );
  expressApp.use(
    createProxyMiddleware({
      target: notifUrl,
      changeOrigin: true,
      pathFilter: '/api/notif-spec',
      pathRewrite: { '^/api/notif-spec': '/api/docs-json' },
    }),
  );
  expressApp.use(
    createProxyMiddleware({
      target: aiUrl,
      changeOrigin: true,
      pathFilter: '/api/ai-spec',
      pathRewrite: { '^/api/ai-spec': '/openapi.json' },
    }),
  );

  // ── Proxies métier ───────────────────────────────────────────────────────────
  for (const route of SERVICE_ROUTES) {
    const target = process.env[route.envKey] ?? route.defaultUrl;

    expressApp.use(
      createProxyMiddleware({
        ...buildProxyOptions(target),
        pathFilter: route.path,
      }),
    );

    logger.log(`${route.path} → ${target} (${route.label})`);
  }

  // ── Catch-all /api → academic service ───────────────────────────────────────
  expressApp.use(
    createProxyMiddleware({
      ...buildProxyOptions(academicUrl),
      pathFilter: '/api',
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`API Gateway SOA démarré sur le port ${port}`);
  logger.log(`Swagger UI → http://localhost:${port}/api/docs`);
}

bootstrap();
