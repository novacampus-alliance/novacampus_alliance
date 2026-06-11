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
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramsService } from './programs.service';

@ApiTags('Programmes')
@ApiBearerAuth('JWT')
@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les programmes', description: 'Filtre optionnel par campus.' })
  @ApiQuery({ name: 'campus_id', required: false, description: 'ID du campus', example: 'CAMP001' })
  @ApiResponse({ status: 200, description: 'Liste des programmes.' })
  findAll(@Query('campus_id') campusId?: string) {
    return this.programsService.findAll(campusId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détail d\'un programme', description: 'Inclut campus, étudiants inscrits et cours associés.' })
  @ApiParam({ name: 'id', description: 'ID du programme', example: 'PROG001' })
  @ApiResponse({ status: 200, description: 'Détail du programme.' })
  @ApiResponse({ status: 404, description: 'Programme introuvable.' })
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer un programme' })
  @ApiResponse({ status: 201, description: 'Programme créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour un programme' })
  @ApiParam({ name: 'id', description: 'ID du programme', example: 'PROG001' })
  @ApiResponse({ status: 200, description: 'Programme mis à jour.' })
  @ApiResponse({ status: 404, description: 'Programme introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }
}
