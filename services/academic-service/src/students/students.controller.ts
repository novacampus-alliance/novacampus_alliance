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
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  findAll(
    @Query('campus_id') campusId?: string,
    @Query('program_id') programId?: string,
    @Query('email') email?: string,
  ) {
    return this.studentsService.findAll(campusId, programId, email);
  }

  @Get(':id/dossier')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  findDossier(@Param('id') id: string) {
    return this.studentsService.findDossier(id);
  }

  @Get(':id/notes')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  findNotes(@Param('id') id: string) {
    return this.studentsService.findNotes(id);
  }

  @Get(':id/absences')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR, Role.STUDENT)
  findAbsences(@Param('id') id: string) {
    return this.studentsService.findAbsences(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRECTION, Role.INSTRUCTOR)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DIRECTION)
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.DIRECTION)
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }
}
