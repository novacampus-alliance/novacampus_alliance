import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Module = regroupe tout ce qui concerne l'authentification.
 * NestJS charge ce module une fois, et tous les services/guards sont disponibles.
 */
@Module({
  imports: [
    // Passport = bibliothèque qui gère les stratégies d'authentification
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule = configure comment créer et vérifier les tokens JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Secret partagé avec le frontend (middleware) pour signer/vérifier les tokens
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Durée de vie du token (après, l'utilisateur doit se reconnecter)
          expiresIn: config.get('JWT_EXPIRES_IN') ?? '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule], // Exporté pour que d'autres modules puissent utiliser l'auth
})
export class AuthModule {}
