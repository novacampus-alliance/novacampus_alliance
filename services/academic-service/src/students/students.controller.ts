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
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@ApiTags('Étudiants')
@ApiBearerAuth('JWT')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les étudiants', description: 'Filtres optionnels par campus et programme.' })
  @ApiQuery({ name: 'campus_id', required: false, example: 'CAMP001' })
  @ApiQuery({ name: 'program_id', required: false, example: 'PROG001' })
  @ApiResponse({ status: 200, description: 'Liste des étudiants.' })
  findAll(
    @Query('campus_id') campusId?: string,
    @Query('program_id') programId?: string,
  ) {
    return this.studentsService.findAll(campusId, programId);
  }

  @Get(':id/dossier')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: 'Dossier complet d\'un étudiant', description: 'Retourne les informations complètes : inscriptions, notes, absences et paiements.' })
  @ApiParam({ name: 'id', description: "ID de l'étudiant", example: 'STU001' })
  @ApiResponse({ status: 200, description: "Dossier de l'étudiant." })
  @ApiResponse({ status: 404, description: 'Étudiant introuvable.' })
  findDossier(@Param('id') id: string) {
    return this.studentsService.findDossier(id);
  }

  @Get(':id/notes')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: "Notes d'un étudiant" })
  @ApiParam({ name: 'id', description: "ID de l'étudiant", example: 'STU001' })
  @ApiResponse({ status: 200, description: 'Relevé de notes.' })
  findNotes(@Param('id') id: string) {
    return this.studentsService.findNotes(id);
  }

  @Get(':id/absences')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: "Absences d'un étudiant" })
  @ApiParam({ name: 'id', description: "ID de l'étudiant", example: 'STU001' })
  @ApiResponse({ status: 200, description: "Taux d'assiduité par cours." })
  findAbsences(@Param('id') id: string) {
    return this.studentsService.findAbsences(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détail d\'un étudiant' })
  @ApiParam({ name: 'id', description: "ID de l'étudiant", example: 'STU001' })
  @ApiResponse({ status: 200, description: "Informations de l'étudiant." })
  @ApiResponse({ status: 404, description: 'Étudiant introuvable.' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer un étudiant' })
  @ApiResponse({ status: 201, description: 'Étudiant créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour un étudiant' })
  @ApiParam({ name: 'id', description: "ID de l'étudiant", example: 'STU001' })
  @ApiResponse({ status: 200, description: 'Étudiant mis à jour.' })
  @ApiResponse({ status: 404, description: 'Étudiant introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }
}
