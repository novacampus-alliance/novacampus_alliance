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
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomAvailabilityQueryDto } from './dto/room-availability-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('Salles')
@ApiBearerAuth('JWT')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get('available')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Salles disponibles sur un créneau', description: 'Retourne les salles libres pour un campus, un jour et une plage horaire donnés.' })
  @ApiQuery({ name: 'campus_id', required: true, example: 'CAMP001' })
  @ApiQuery({ name: 'day_of_week', required: true, description: '1=Lundi … 7=Dimanche', example: 1 })
  @ApiQuery({ name: 'start_time', required: true, example: '09:00' })
  @ApiQuery({ name: 'end_time', required: true, example: '12:00' })
  @ApiQuery({ name: 'academic_year', required: false, example: '2023-2024' })
  @ApiResponse({ status: 200, description: 'Liste des salles disponibles.' })
  findAvailable(@Query() query: RoomAvailabilityQueryDto) {
    return this.roomsService.findAvailable(query);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Lister les salles', description: 'Filtres optionnels par campus et/ou bâtiment.' })
  @ApiQuery({ name: 'campus_id', required: false, example: 'CAMP001' })
  @ApiQuery({ name: 'building', required: false, example: 'Bâtiment A' })
  @ApiResponse({ status: 200, description: 'Liste des salles.' })
  findAll(
    @Query('campus_id') campusId?: string,
    @Query('building') building?: string,
  ) {
    return this.roomsService.findAll(campusId, building);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Détail d\'une salle' })
  @ApiParam({ name: 'id', description: 'ID de la salle', example: 'ROOM101' })
  @ApiResponse({ status: 200, description: 'Détail de la salle.' })
  @ApiResponse({ status: 404, description: 'Salle introuvable.' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Créer une salle' })
  @ApiResponse({ status: 201, description: 'Salle créée.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  @ApiOperation({ summary: 'Mettre à jour une salle' })
  @ApiParam({ name: 'id', description: 'ID de la salle', example: 'ROOM101' })
  @ApiResponse({ status: 200, description: 'Salle mise à jour.' })
  @ApiResponse({ status: 404, description: 'Salle introuvable.' })
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }
}
