import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur', description: 'Retourne un token JWT si les identifiants sont valides.' })
  @ApiResponse({ status: 200, description: 'Connexion réussie — token JWT retourné.' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Déconnexion', description: 'Invalide la session de l\'utilisateur connecté.' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie.' })
  @ApiResponse({ status: 401, description: 'Token absent ou invalide.' })
  logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Profil courant', description: 'Retourne les informations de l\'utilisateur connecté.' })
  @ApiResponse({ status: 200, description: 'Profil retourné.' })
  @ApiResponse({ status: 401, description: 'Token absent ou invalide.' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }
}
