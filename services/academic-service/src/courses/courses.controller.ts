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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('Cours')
@ApiBearerAuth('JWT')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les cours', description: 'Filtres optionnels par programme et/ou enseignant.' })
  @ApiQuery({ name: 'program_id', required: false, description: 'ID du programme', example: 'PROG001' })
  @ApiQuery({ name: 'instructor_id', required: false, description: "ID de l'enseignant", example: 'INST001' })
  @ApiResponse({ status: 200, description: 'Liste des cours.' })
  findAll(
    @Query('program_id') programId?: string,
    @Query('instructor_id') instructorId?: string,
  ) {
    return this.coursesService.findAll(programId, instructorId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détail d\'un cours' })
  @ApiParam({ name: 'id', description: 'ID du cours', example: 'CRS001' })
  @ApiResponse({ status: 200, description: 'Détail du cours.' })
  @ApiResponse({ status: 404, description: 'Cours introuvable.' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer un cours' })
  @ApiResponse({ status: 201, description: 'Cours créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour un cours' })
  @ApiParam({ name: 'id', description: 'ID du cours', example: 'CRS001' })
  @ApiResponse({ status: 200, description: 'Cours mis à jour.' })
  @ApiResponse({ status: 404, description: 'Cours introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }
}
