import { Role } from '@prisma/client';

/**
 * Contenu embarqué dans le JWT (le "payload").
 * Ces infos voyagent dans le token et sont lisibles (mais pas modifiables sans le secret).
 */
export interface JwtPayload {
  sub: string; // ID utilisateur
  email: string;
  role: Role; // STUDENT | INSTRUCTOR | ADMIN | DIRECTION
  firstName: string;
  lastName: string;
}
