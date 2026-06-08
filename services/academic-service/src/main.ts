import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Toutes les routes commencent par /api (ex: /api/auth/login)
  app.setGlobalPrefix('api');

  // Valide automatiquement les DTOs (@IsEmail, @MinLength, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // Rejette si champs inconnus envoyés
      transform: true,
    }),
  );

  // Autorise le frontend (localhost:3000) à appeler l'API
  // credentials: true → nécessaire pour les cookies cross-origin
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`Svc Académique démarré sur le port ${port}`);
}
bootstrap();
