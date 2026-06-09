import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseTimeToDate, timesOverlap } from '../common/utils/time.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

const scheduleDetailInclude = {
  course: {
    select: {
      course_id: true,
      course_name: true,
      course_code: true,
      program: {
        select: {
          program_id: true,
          program_name: true,
          campus_id: true,
        },
      },
    },
  },
  instructor: {
    select: {
      instructor_id: true,
      first_name: true,
      last_name: true,
    },
  },
  room: {
    select: {
      room_id: true,
      room_name: true,
      building: true,
      campus_id: true,
    },
  },
} satisfies Prisma.ScheduleInclude;

type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: typeof scheduleDetailInclude;
}>;

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    campusId?: string,
    academicYear?: string,
    instructorId?: string,
  ) {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        ...(instructorId ? { instructor_id: instructorId } : {}),
        ...(academicYear ? { academic_year: academicYear } : {}),
        ...(campusId
          ? { room: { campus_id: campusId } }
          : {}),
      },
      include: scheduleDetailInclude,
      orderBy: [
        { day_of_week: 'asc' },
        { start_time: 'asc' },
      ],
    });
    return schedules;
  }

  async findConflicts(campusId?: string) {
    const schedules = await this.prisma.schedule.findMany({
      where: campusId ? { room: { campus_id: campusId } } : undefined,
      include: {
        room: { select: { room_id: true, room_name: true, campus_id: true } },
        course: { select: { course_id: true, course_name: true } },
        instructor: {
          select: { instructor_id: true, first_name: true, last_name: true },
        },
      },
      orderBy: [{ room_id: 'asc' }, { day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    const conflicts: Array<{
      schedule_a: (typeof schedules)[number];
      schedule_b: (typeof schedules)[number];
      reason: string;
    }> = [];

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];
        if (
          a.room_id === b.room_id &&
          a.day_of_week === b.day_of_week &&
          timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)
        ) {
          conflicts.push({
            schedule_a: a,
            schedule_b: b,
            reason: `Conflit salle ${a.room.room_name} — jour ${a.day_of_week}`,
          });
        }
      }
    }
    return conflicts;
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { schedule_id: id },
      include: scheduleDetailInclude,
    });
    if (!schedule) {
      throw new NotFoundException(`Planning introuvable : ${id}`);
    }
    return schedule;
  }

  async create(dto: CreateScheduleDto) {
    await this.ensureCourseExists(dto.course_id);
    await this.ensureInstructorExists(dto.instructor_id);
    await this.ensureRoomExists(dto.room_id);

    const startTime = parseTimeToDate(dto.start_time);
    const endTime = parseTimeToDate(dto.end_time);
    if (startTime >= endTime) {
      throw new UnprocessableEntityException(
        'Heure de fin doit etre posterieure a heure de debut',
      );
    }

    await this.assertNoRoomConflict(
      dto.room_id,
      dto.day_of_week,
      startTime,
      endTime,
    );

    const schedule = await this.prisma.schedule.create({
      data: {
        course_id: dto.course_id,
        instructor_id: dto.instructor_id,
        room_id: dto.room_id,
        day_of_week: dto.day_of_week,
        start_time: startTime,
        end_time: endTime,
        semester: dto.semester,
        academic_year: dto.academic_year,
        status: dto.status ?? 'planifie',
      },
      include: scheduleDetailInclude,
    });
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto) {
    const existing = await this.prisma.schedule.findUnique({
      where: { schedule_id: id },
    });
    if (!existing) {
      throw new NotFoundException(`Planning introuvable : ${id}`);
    }

    if (dto.course_id) await this.ensureCourseExists(dto.course_id);
    if (dto.instructor_id) await this.ensureInstructorExists(dto.instructor_id);
    if (dto.room_id) await this.ensureRoomExists(dto.room_id);

    const roomId = dto.room_id ?? existing.room_id;
    const dayOfWeek = dto.day_of_week ?? existing.day_of_week;
    const startTime = dto.start_time
      ? parseTimeToDate(dto.start_time)
      : existing.start_time;
    const endTime = dto.end_time
      ? parseTimeToDate(dto.end_time)
      : existing.end_time;

    if (startTime >= endTime) {
      throw new UnprocessableEntityException(
        'Heure de fin doit etre posterieure a heure de debut',
      );
    }

    await this.assertNoRoomConflict(roomId, dayOfWeek, startTime, endTime, id);

    const data: Prisma.ScheduleUpdateInput = {};
    if (dto.course_id !== undefined)
      data.course = { connect: { course_id: dto.course_id } };
    if (dto.instructor_id !== undefined)
      data.instructor = { connect: { instructor_id: dto.instructor_id } };
    if (dto.room_id !== undefined)
      data.room = { connect: { room_id: dto.room_id } };
    if (dto.day_of_week !== undefined) data.day_of_week = dto.day_of_week;
    if (dto.start_time !== undefined) data.start_time = startTime;
    if (dto.end_time !== undefined) data.end_time = endTime;
    if (dto.semester !== undefined) data.semester = dto.semester;
    if (dto.academic_year !== undefined) data.academic_year = dto.academic_year;
    if (dto.status !== undefined) data.status = dto.status;

    const schedule = await this.prisma.schedule.update({
      where: { schedule_id: id },
      data,
      include: scheduleDetailInclude,
    });
    return schedule;
  }

  private async assertNoRoomConflict(
    roomId: string,
    dayOfWeek: number,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ) {
    const existing = await this.prisma.schedule.findMany({
      where: {
        room_id: roomId,
        day_of_week: dayOfWeek,
        ...(excludeId ? { schedule_id: { not: excludeId } } : {}),
      },
      include: {
        room: { select: { room_name: true } },
        course: { select: { course_name: true } },
      },
    });

    for (const slot of existing) {
      if (timesOverlap(startTime, endTime, slot.start_time, slot.end_time)) {
        throw new ConflictException({
          message: `Conflit de salle : ${slot.room.room_name} deja reservee (${slot.course.course_name})`,
          conflicting_schedule_id: slot.schedule_id,
        });
      }
    }
  }

  private async ensureCourseExists(courseId: string) {
    const c = await this.prisma.course.findUnique({
      where: { course_id: courseId },
      select: { course_id: true },
    });
    if (!c)
      throw new UnprocessableEntityException(`Cours introuvable : ${courseId}`);
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
}
