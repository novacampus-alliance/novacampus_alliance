import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const courseDetailInclude = {
  program: {
    select: {
      program_id: true,
      program_name: true,
      campus_id: true,
      campus: { select: { campus_id: true, campus_name: true } },
    },
  },
  instructor: {
    select: {
      instructor_id: true,
      first_name: true,
      last_name: true,
      department: true,
    },
  },
  room: {
    select: {
      room_id: true,
      room_name: true,
      building: true,
      capacity: true,
    },
  },
  schedules: {
    select: {
      schedule_id: true,
      day_of_week: true,
      start_time: true,
      end_time: true,
    },
  },
  _count: { select: { enrollments: true, schedules: true } },
} satisfies Prisma.CourseInclude;

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: typeof courseDetailInclude;
}>;

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(programId?: string, instructorId?: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        ...(programId ? { program_id: programId } : {}),
        ...(instructorId ? { instructor_id: instructorId } : {}),
      },
      include: {
        program: { select: { program_id: true, program_name: true } },
        instructor: {
          select: { instructor_id: true, first_name: true, last_name: true },
        },
        room: { select: { room_id: true, room_name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ program: { program_name: 'asc' } }, { course_name: 'asc' }],
    });
    return courses.map((c) => ({
      ...c,
      counts: { inscriptions: c._count.enrollments },
    }));
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: id },
      include: courseDetailInclude,
    });
    if (!course) throw new NotFoundException(`Cours introuvable : ${id}`);
    return this.formatDetail(course);
  }

  async create(dto: CreateCourseDto) {
    await this.ensureProgramExists(dto.program_id);
    await this.ensureInstructorExists(dto.instructor_id);
    const roomId = dto.room_id?.trim() || undefined;
    if (roomId) await this.ensureRoomExists(roomId);

    const course = await this.prisma.course.create({
      data: {
        program_id: dto.program_id,
        instructor_id: dto.instructor_id,
        room_id: roomId,
        course_name: dto.course_name,
        course_code: dto.course_code,
        semester: dto.semester,
        credits: dto.credits,
        hours_total: dto.hours_total,
        status: dto.status,
      },
      include: courseDetailInclude,
    });
    return this.formatDetail(course);
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.ensureCourseExists(id);
    if (dto.program_id) await this.ensureProgramExists(dto.program_id);
    if (dto.instructor_id) await this.ensureInstructorExists(dto.instructor_id);
    const roomId =
      dto.room_id !== undefined ? dto.room_id?.trim() || null : undefined;
    if (roomId) await this.ensureRoomExists(roomId);

    const data: Prisma.CourseUpdateInput = {};
    if (dto.program_id !== undefined)
      data.program = { connect: { program_id: dto.program_id } };
    if (dto.instructor_id !== undefined)
      data.instructor = { connect: { instructor_id: dto.instructor_id } };
    if (roomId !== undefined)
      data.room = roomId
        ? { connect: { room_id: roomId } }
        : { disconnect: true };
    if (dto.course_name !== undefined) data.course_name = dto.course_name;
    if (dto.course_code !== undefined) data.course_code = dto.course_code;
    if (dto.semester !== undefined) data.semester = dto.semester;
    if (dto.credits !== undefined) data.credits = dto.credits;
    if (dto.hours_total !== undefined) data.hours_total = dto.hours_total;
    if (dto.status !== undefined) data.status = dto.status;

    const course = await this.prisma.course.update({
      where: { course_id: id },
      data,
      include: courseDetailInclude,
    });
    return this.formatDetail(course);
  }

  private async ensureCourseExists(id: string) {
    const exists = await this.prisma.course.findUnique({
      where: { course_id: id },
      select: { course_id: true },
    });
    if (!exists) throw new NotFoundException(`Cours introuvable : ${id}`);
  }

  private async ensureProgramExists(programId: string) {
    const p = await this.prisma.program.findUnique({
      where: { program_id: programId },
      select: { program_id: true },
    });
    if (!p)
      throw new UnprocessableEntityException(
        `Programme introuvable : ${programId}`,
      );
  }

  private async ensureInstructorExists(instructorId: string) {
    const i = await this.prisma.instructor.findUnique({
      where: { instructor_id: instructorId },
      select: { instructor_id: true },
    });
    if (!i)
      throw new UnprocessableEntityException(
        `Enseignant introuvable : ${instructorId}`,
      );
  }

  private async ensureRoomExists(roomId: string) {
    const r = await this.prisma.room.findUnique({
      where: { room_id: roomId },
      select: { room_id: true },
    });
    if (!r)
      throw new UnprocessableEntityException(`Salle introuvable : ${roomId}`);
  }

  private formatDetail(course: CourseWithRelations) {
    return {
      ...course,
      counts: {
        inscriptions: course._count.enrollments,
        creneaux: course._count.schedules,
      },
    };
  }
}
