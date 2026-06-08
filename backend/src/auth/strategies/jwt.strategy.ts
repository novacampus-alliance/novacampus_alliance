import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Strategy = comment Passport extrait et valide le JWT à chaque requête protégée.
 *
 * Quand un guard @UseGuards(JwtAuthGuard) est actif :
 * 1. Passport lit le header "Authorization: Bearer <token>"
 * 2. Il vérifie la signature avec JWT_SECRET
 * 3. Il appelle validate() avec le contenu décodé du token
 * 4. Le résultat de validate() est attaché à request.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Où trouver le token dans la requête HTTP
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Refuser les tokens expirés
      ignoreExpiration: false,
      // Même secret que celui utilisé pour signer le token au login
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Appelé automatiquement si le token est valide (signature + expiration OK).
   * On re-vérifie en BDD que l'utilisateur existe toujours et est actif.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { user_id: payload.sub },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Utilisateur invalide ou desactive');
    }

    // Ces données seront accessibles via request.user dans les controllers
    return {
      sub: user.user_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }
}
