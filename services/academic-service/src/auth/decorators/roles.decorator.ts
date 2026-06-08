import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/** Clé utilisée en interne par RolesGuard pour retrouver les rôles requis */
export const ROLES_KEY = 'roles';

/**
 * Décorateur @Roles() — à placer au-dessus d'une route pour limiter l'accès.
 *
 * Exemple :
 *   @Roles(Role.ADMIN, Role.DIRECTION)
 *   @Get('rapports')
 *   getRapports() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
