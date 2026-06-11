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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('EDT')
@ApiBearerAuth('JWT')
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Get('conflicts')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détecter les conflits de créneaux', description: 'Retourne les créneaux qui se chevauchent (même salle ou même enseignant).' })
  @ApiQuery({ name: 'campus_id', required: false, example: 'CAMP001' })
  @ApiResponse({ status: 200, description: 'Liste des conflits détectés.' })
  findConflicts(@Query('campus_id') campusId?: string) {
    return this.schedulesService.findConflicts(campusId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: "Lister l'EDT", description: 'Filtres optionnels par campus, année académique et enseignant.' })
  @ApiQuery({ name: 'campus_id', required: false, example: 'CAMP001' })
  @ApiQuery({ name: 'academic_year', required: false, example: '2023-2024' })
  @ApiQuery({ name: 'instructor_id', required: false, example: 'INST001' })
  @ApiResponse({ status: 200, description: "Créneaux de l'EDT." })
  findAll(
    @Query('campus_id') campusId?: string,
    @Query('academic_year') academicYear?: string,
    @Query('instructor_id') instructorId?: string,
  ) {
    return this.schedulesService.findAll(campusId, academicYear, instructorId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: 'Détail d\'un créneau EDT' })
  @ApiParam({ name: 'id', description: 'ID du créneau', example: 'SCH001' })
  @ApiResponse({ status: 200, description: 'Détail du créneau.' })
  @ApiResponse({ status: 404, description: 'Créneau introuvable.' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer un créneau EDT' })
  @ApiResponse({ status: 201, description: 'Créneau créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou conflit.' })
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour un créneau EDT' })
  @ApiParam({ name: 'id', description: 'ID du créneau', example: 'SCH001' })
  @ApiResponse({ status: 200, description: 'Créneau mis à jour.' })
  @ApiResponse({ status: 404, description: 'Créneau introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }
}
