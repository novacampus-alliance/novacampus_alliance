import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Controller = la "porte d'entrée" HTTP de l'authentification.
 * Il reçoit les requêtes du frontend et délègue le travail à AuthService.
 *
 * Toutes les routes ici sont préfixées par /api/auth (voir main.ts).
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Route PUBLIQUE : n'importe qui peut tenter de se connecter.
   * Le body doit contenir { email, password }.
   */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/logout
   * Route PROTÉGÉE : il faut être connecté (token JWT valide).
   * @UseGuards(JwtAuthGuard) bloque la requête si le token est absent/invalide.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.authService.logout();
  }

  /**
   * GET /api/auth/me
   * Retourne le profil de l'utilisateur connecté.
   * @CurrentUser() injecte automatiquement les infos extraites du JWT.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }
}
