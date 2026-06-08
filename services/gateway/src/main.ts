import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';
import { buildProxyOptions, SERVICE_ROUTES } from './proxy/proxy.config';

/**
 * Bootstrap du API Gateway — couche routage & sécurité SOA.
 *
 * Toutes les requêtes /api/* sont redirigées vers le service métier approprié.
 * Le frontend et les clients externes ne parlent qu'au gateway (port 3001).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Gateway');
  const expressApp = app.getHttpAdapter().getInstance();

  // Enregistre un reverse proxy par service métier
  for (const route of SERVICE_ROUTES) {
    const target =
      process.env[route.envKey] ?? route.defaultUrl;

    expressApp.use(
      route.path,
      createProxyMiddleware(buildProxyOptions(target, route.path)),
    );

    logger.log(`${route.path} → ${target} (${route.label})`);
  }

  // Route racine /api vers le service académique (health check métier)
  const academicUrl =
    process.env.ACADEMIC_SERVICE_URL ?? 'http://localhost:3001';
  expressApp.use(
    '/api',
    createProxyMiddleware(buildProxyOptions(academicUrl, '/api')),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API Gateway SOA démarré sur le port ${port}`);
}

bootstrap();
