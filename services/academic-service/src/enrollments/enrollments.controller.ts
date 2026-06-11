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
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateEnrollmentNoteDto } from './dto/update-enrollment-note.dto';
import { UpdateEnrollmentPresenceDto } from './dto/update-enrollment-presence.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Inscriptions')
@ApiBearerAuth('JWT')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les inscriptions', description: 'Filtres optionnels par étudiant, cours et année académique.' })
  @ApiQuery({ name: 'student_id', required: false, example: 'STU001' })
  @ApiQuery({ name: 'course_id', required: false, example: 'CRS001' })
  @ApiQuery({ name: 'academic_year', required: false, example: '2023-2024' })
  @ApiResponse({ status: 200, description: 'Liste des inscriptions.' })
  findAll(
    @Query('student_id') studentId?: string,
    @Query('course_id') courseId?: string,
    @Query('academic_year') academicYear?: string,
  ) {
    return this.enrollmentsService.findAll(studentId, courseId, academicYear);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: 'Détail d\'une inscription' })
  @ApiParam({ name: 'id', description: "ID de l'inscription", example: 'ENR001' })
  @ApiResponse({ status: 200, description: "Détail de l'inscription." })
  @ApiResponse({ status: 404, description: 'Inscription introuvable.' })
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer une inscription' })
  @ApiResponse({ status: 201, description: 'Inscription créée.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour une inscription' })
  @ApiParam({ name: 'id', description: "ID de l'inscription", example: 'ENR001' })
  @ApiResponse({ status: 200, description: 'Inscription mise à jour.' })
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentsService.update(id, dto);
  }

  @Put(':id/note')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Saisir / modifier la note finale' })
  @ApiParam({ name: 'id', description: "ID de l'inscription", example: 'ENR001' })
  @ApiResponse({ status: 200, description: 'Note mise à jour.' })
  updateNote(@Param('id') id: string, @Body() dto: UpdateEnrollmentNoteDto) {
    return this.enrollmentsService.updateNote(id, dto);
  }

  @Put(':id/presence')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Mettre à jour le taux de présence' })
  @ApiParam({ name: 'id', description: "ID de l'inscription", example: 'ENR001' })
  @ApiResponse({ status: 200, description: 'Présence mise à jour.' })
  updatePresence(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentPresenceDto,
  ) {
    return this.enrollmentsService.updatePresence(id, dto);
  }
}
