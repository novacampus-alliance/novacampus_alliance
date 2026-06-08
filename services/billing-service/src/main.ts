import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`Svc Facturation démarré sur le port ${port}`);
}

bootstrap();
