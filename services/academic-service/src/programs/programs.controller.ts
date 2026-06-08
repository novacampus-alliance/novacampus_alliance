import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramsService } from './programs.service';

/**
 * Controller Programmes — endpoints REST pour les filières et formations.
 *
 * Routes préfixées par /api/programs (voir main.ts).
 * Exposé publiquement via le gateway : GET http://localhost:3001/api/programs
 */
@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  /**
   * GET /api/programs
   * Liste tous les programmes. Filtre optionnel : ?campus_id=xxx
   */
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findAll(@Query('campus_id') campusId?: string) {
    return this.programsService.findAll(campusId);
  }

  /**
   * GET /api/programs/:id
   * Détail d'un programme avec campus, étudiants inscrits et cours associés.
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  /**
   * POST /api/programs
   * Crée un programme rattaché à un campus. Réservé à l'administration et la direction.
   */
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }

  /**
   * PUT /api/programs/:id
   * Met à jour un programme existant.
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }
}
