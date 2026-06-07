import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Décorateur @CurrentUser() — récupère l'utilisateur connecté dans un controller.
 *
 * Au lieu d'écrire :
 *   const user = request.user;
 *
 * On écrit simplement :
 *   me(@CurrentUser() user: JwtPayload)
 *
 * Fonctionne uniquement sur les routes protégées par JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
