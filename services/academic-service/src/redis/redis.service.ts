import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service Redis — connexion partagée pour le cache et la liste noire JWT.
 *
 * Si REDIS_URL est absent (ex. tests unitaires), les opérations sont ignorées
 * sans faire planter l'application.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn(
        'REDIS_URL non configure — la revocation JWT sera desactivee',
      );
      return;
    }

    this.client = new Redis(url, { maxRetriesPerRequest: 3 });
    this.client.on('error', (err) =>
      this.logger.error(`Erreur Redis : ${err.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  /** Indique si Redis est disponible pour les opérations critiques */
  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * Ajoute un token (identifié par son jti) à la liste noire.
   * TTL = durée restante du JWT pour libérer la mémoire automatiquement.
   */
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;

    const key = `auth:blacklist:${jti}`;
    await this.client.set(key, '1', 'EX', Math.max(ttlSeconds, 1));
  }

  /** Vérifie si un jti a été révoqué lors d'une déconnexion */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.client) return false;

    const exists = await this.client.exists(`auth:blacklist:${jti}`);
    return exists === 1;
  }
}
