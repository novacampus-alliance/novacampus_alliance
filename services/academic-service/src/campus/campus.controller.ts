import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

/**
 * Controller Campus — endpoints REST pour la gestion multi-campus.
 *
 * Routes préfixées par /api/campus (voir main.ts).
 * Toutes les routes nécessitent une authentification JWT.
 */
@Controller('campus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampusController {
  constructor(private campusService: CampusService) {}

  /**
   * GET /api/campus
   * Liste tous les campus avec compteurs (programmes, enseignants, etc.).
   * Accès : Administration, Direction, Enseignants (consultation).
   */
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findAll() {
    return this.campusService.findAll();
  }

  /**
   * GET /api/campus/:id
   * Détail d'un campus avec adresse, programmes, enseignants, étudiants et bâtiments.
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findOne(@Param('id') id: string) {
    return this.campusService.findOne(id);
  }

  /**
   * POST /api/campus
   * Crée un nouveau campus. Réservé à l'administration et la direction.
   */
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  create(@Body() dto: CreateCampusDto) {
    return this.campusService.create(dto);
  }

  /**
   * PUT /api/campus/:id
   * Met à jour un campus existant. Réservé à l'administration et la direction.
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  update(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.campusService.update(id, dto);
  }
}
