import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Novacampus Alliance — Service Académique')
    .setDescription(
      'API REST de gestion académique : campus, programmes, enseignants, salles, cours, EDT, étudiants et inscriptions.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('Auth', 'Authentification et gestion de session')
    .addTag('Campus', 'Gestion multi-campus')
    .addTag('Programmes', 'Filières et formations')
    .addTag('Enseignants', 'Corps professoral')
    .addTag('Salles', 'Salles et disponibilités')
    .addTag('Cours', "Unités d'enseignement")
    .addTag('EDT', 'Emploi du temps (plannings)')
    .addTag('Étudiants', 'Gestion des étudiants')
    .addTag('Inscriptions', 'Inscriptions aux cours, notes et présences')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`Svc Académique démarré sur le port ${port}`);
  console.log(`Swagger disponible sur http://localhost:${port}/api/docs`);
}
bootstrap();
