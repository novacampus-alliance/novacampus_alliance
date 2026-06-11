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
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorsService } from './instructors.service';

/**
 * Controller Enseignants — endpoints REST pour la gestion du corps professoral.
 *
 * Routes préfixées par /api/instructors (voir main.ts).
 * Exposé publiquement via le gateway : GET http://localhost:3001/api/instructors
 */
@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorsController {
  constructor(private instructorsService: InstructorsService) {}

  /**
   * GET /api/instructors
   * Liste tous les enseignants. Filtres optionnels : ?campus_id=xxx, ?email=xxx
   */
  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findAll(
    @Query('campus_id') campusId?: string,
    @Query('email') email?: string,
  ) {
    return this.instructorsService.findAll(campusId, email);
  }

  /**
   * GET /api/instructors/:id
   * Détail d'un enseignant avec campus, cours assignés et créneaux EDT.
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findOne(@Param('id') id: string) {
    return this.instructorsService.findOne(id);
  }

  /**
   * POST /api/instructors
   * Crée un enseignant rattaché à un campus. Réservé à l'administration et la direction.
   */
  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  create(@Body() dto: CreateInstructorDto) {
    return this.instructorsService.create(dto);
  }

  /**
   * PUT /api/instructors/:id
   * Met à jour un enseignant existant.
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  update(@Param('id') id: string, @Body() dto: UpdateInstructorDto) {
    return this.instructorsService.update(id, dto);
  }
}
