import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard = un "vigile" qui bloque les requêtes non authentifiées.
 *
 * JwtAuthGuard active la JwtStrategy définie plus haut.
 * Si le token est absent, invalide ou expiré → erreur 401 Unauthorized.
 *
 * Usage : @UseGuards(JwtAuthGuard) sur une route ou un controller entier.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
