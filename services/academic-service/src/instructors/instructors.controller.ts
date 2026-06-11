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
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorsService } from './instructors.service';

@ApiTags('Enseignants')
@ApiBearerAuth('JWT')
@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorsController {
  constructor(private instructorsService: InstructorsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les enseignants', description: 'Filtre optionnel par campus.' })
  @ApiQuery({ name: 'campus_id', required: false, description: 'ID du campus', example: 'CAMP001' })
  @ApiResponse({ status: 200, description: 'Liste des enseignants.' })
  findAll(@Query('campus_id') campusId?: string) {
    return this.instructorsService.findAll(campusId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détail d\'un enseignant', description: 'Inclut le campus, les cours assignés et les créneaux EDT.' })
  @ApiParam({ name: 'id', description: "ID de l'enseignant", example: 'INST001' })
  @ApiResponse({ status: 200, description: "Détail de l'enseignant." })
  @ApiResponse({ status: 404, description: 'Enseignant introuvable.' })
  findOne(@Param('id') id: string) {
    return this.instructorsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer un enseignant' })
  @ApiResponse({ status: 201, description: 'Enseignant créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateInstructorDto) {
    return this.instructorsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour un enseignant' })
  @ApiParam({ name: 'id', description: "ID de l'enseignant", example: 'INST001' })
  @ApiResponse({ status: 200, description: 'Enseignant mis à jour.' })
  @ApiResponse({ status: 404, description: 'Enseignant introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateInstructorDto) {
    return this.instructorsService.update(id, dto);
  }
}
