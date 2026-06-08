import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { parseJwtExpiryToSeconds } from './utils/parse-jwt-expiry.util';

/**
 * Service = la logique métier de l'authentification.
 * Le controller ne fait que recevoir/envoyer ; c'est ici que tout se décide.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    // 1. Chercher l'utilisateur en base de données par son email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // 2. Vérifier qu'il existe et que son compte est actif
    if (!user || !user.is_active) {
      // Message volontairement vague pour ne pas révéler si l'email existe
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // 3. Comparer le mot de passe saisi avec le hash stocké en BDD
    // bcrypt.compare() ne déchiffre pas : il re-hash le mot de passe et compare
    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // 4. Mettre à jour la date de dernière connexion
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    // 5. Construire le "contenu" du JWT (payload = données embarquées dans le token)
    const payload: JwtPayload = {
      sub: user.user_id, // "sub" = subject = identifiant unique de l'utilisateur
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      jti: randomUUID(), // identifiant du token pour invalidation au logout
    };

    // 6. Signer le JWT et le renvoyer au client
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }

  /**
   * Déconnexion côté serveur — révoque le JWT en cours via Redis.
   *
   * Le jti (JWT ID) est ajouté à une liste noire avec un TTL égal à la durée
   * de vie du token. Toute requête ultérieure avec ce token sera rejetée (401).
   * Le frontend doit aussi supprimer le cookie httpOnly.
   */
  async logout(user: JwtPayload) {
    const expiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d';
    const ttlSeconds = parseJwtExpiryToSeconds(expiresIn);

    await this.redis.blacklistToken(user.jti, ttlSeconds);

    return { message: 'Deconnexion reussie' };
  }

  /** Retourne le profil à partir des infos déjà présentes dans le JWT */
  getProfile(user: JwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
