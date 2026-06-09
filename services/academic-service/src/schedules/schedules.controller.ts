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
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Get('conflicts')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findConflicts(@Query('campus_id') campusId?: string) {
    return this.schedulesService.findConflicts(campusId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  findAll(
    @Query('campus_id') campusId?: string,
    @Query('academic_year') academicYear?: string,
    @Query('instructor_id') instructorId?: string,
  ) {
    return this.schedulesService.findAll(campusId, academicYear, instructorId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }
}
