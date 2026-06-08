import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

/**
 * Module racine du API Gateway — pas de logique métier ici,
 * uniquement routage HTTP vers les microservices.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
})
export class AppModule {}
