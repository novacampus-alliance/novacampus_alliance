import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Guard de rôles = vérifie que l'utilisateur connecté a le BON rôle.
 *
 * Différence avec JwtAuthGuard :
 * - JwtAuthGuard → "Est-ce que tu es connecté ?" (401 si non)
 * - RolesGuard   → "As-tu le droit d'accéder ?" (403 si mauvais rôle)
 *
 * Usage combiné :
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lire les rôles requis définis par @Roles() sur la route
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Pas de @Roles() sur cette route → tout utilisateur connecté peut passer
    if (!requiredRoles?.length) {
      return true;
    }

    // request.user est rempli par JwtAuthGuard / JwtStrategy juste avant
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    // Le rôle DEMO est un passe-partout de démonstration : il accède à
    // toutes les routes, quel que soit le @Roles() exigé.
    if (user?.role === Role.DEMO) {
      return true;
    }

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acces refuse pour ce role');
    }

    return true;
  }
}
