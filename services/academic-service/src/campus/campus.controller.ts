import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

@ApiTags('Campus')
@ApiBearerAuth('JWT')
@Controller('campus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampusController {
  constructor(private campusService: CampusService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les campus', description: 'Retourne tous les campus avec leurs compteurs (programmes, enseignants, étudiants, salles).' })
  @ApiResponse({ status: 200, description: 'Liste des campus.' })
  @ApiResponse({ status: 403, description: 'Rôle insuffisant.' })
  findAll() {
    return this.campusService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détail d\'un campus' })
  @ApiParam({ name: 'id', description: 'Identifiant du campus (ex: CAMP001)', example: 'CAMP001' })
  @ApiResponse({ status: 200, description: 'Détail du campus.' })
  @ApiResponse({ status: 404, description: 'Campus introuvable.' })
  findOne(@Param('id') id: string) {
    return this.campusService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer un campus' })
  @ApiResponse({ status: 201, description: 'Campus créé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateCampusDto) {
    return this.campusService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour un campus' })
  @ApiParam({ name: 'id', description: 'Identifiant du campus', example: 'CAMP001' })
  @ApiResponse({ status: 200, description: 'Campus mis à jour.' })
  @ApiResponse({ status: 404, description: 'Campus introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.campusService.update(id, dto);
  }
}
