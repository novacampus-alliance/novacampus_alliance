import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Novacampus Alliance — Service Facturation')
    .setDescription(
      'API REST de gestion des paiements et de la facturation étudiante (MongoDB + PostgreSQL).',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`Svc Facturation démarré sur le port ${port}`);
  console.log(`Swagger disponible sur http://localhost:${port}/api/docs`);
}

bootstrap();
