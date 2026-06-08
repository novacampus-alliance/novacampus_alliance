import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

const enrollmentDetailInclude = {
  student: {
    select: {
      student_id: true,
      first_name: true,
      last_name: true,
      email: true,
      program_id: true,
    },
  },
  course: {
    select: {
      course_id: true,
      course_name: true,
      course_code: true,
      program_id: true,
      instructor_id: true,
      room_id: true,
      room: { select: { room_id: true, capacity: true } },
      instructor: {
        select: { instructor_id: true, first_name: true, last_name: true },
      },
    },
  },
} satisfies Prisma.EnrollmentInclude;

type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: typeof enrollmentDetailInclude;
}>;

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(studentId?: string, courseId?: string, academicYear?: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        ...(studentId ? { student_id: studentId } : {}),
        ...(courseId ? { course_id: courseId } : {}),
        ...(academicYear ? { academic_year: academicYear } : {}),
      },
      include: enrollmentDetailInclude,
      orderBy: { enrollment_date: 'desc' },
    });
    return enrollments;
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { enrollment_id: id },
      include: enrollmentDetailInclude,
    });
    if (!enrollment) {
      throw new NotFoundException(`Inscription introuvable : ${id}`);
    }
    return enrollment;
  }

  async create(dto: CreateEnrollmentDto) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: dto.student_id },
      select: { student_id: true, program_id: true },
    });
    if (!student) {
      throw new UnprocessableEntityException(
        `Etudiant introuvable : ${dto.student_id}`,
      );
    }

    const course = await this.prisma.course.findUnique({
      where: { course_id: dto.course_id },
      select: {
        course_id: true,
        program_id: true,
        room: { select: { capacity: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) {
      throw new UnprocessableEntityException(
        `Cours introuvable : ${dto.course_id}`,
      );
    }

    if (course.program_id !== student.program_id) {
      throw new UnprocessableEntityException(
        "Le cours n'appartient pas au programme de l'etudiant",
      );
    }

    const capacity = course.room?.capacity;
    if (capacity && course._count.enrollments >= capacity) {
      throw new UnprocessableEntityException(
        'Capacite de la salle atteinte pour ce cours',
      );
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        student_id: dto.student_id,
        course_id: dto.course_id,
        semester: dto.semester,
        academic_year: dto.academic_year,
        status: dto.status ?? 'inscrit',
        enrollment_date: new Date(dto.enrollment_date),
      },
      include: enrollmentDetailInclude,
    });
    return enrollment;
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    await this.ensureExists(id);

    const data: Prisma.EnrollmentUpdateInput = {};
    if (dto.student_id !== undefined)
      data.student = { connect: { student_id: dto.student_id } };
    if (dto.course_id !== undefined)
      data.course = { connect: { course_id: dto.course_id } };
    if (dto.semester !== undefined) data.semester = dto.semester;
    if (dto.academic_year !== undefined) data.academic_year = dto.academic_year;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.enrollment_date !== undefined)
      data.enrollment_date = new Date(dto.enrollment_date);

    const enrollment = await this.prisma.enrollment.update({
      where: { enrollment_id: id },
      data,
      include: enrollmentDetailInclude,
    });
    return enrollment;
  }



  private async ensureExists(id: string) {
    const exists = await this.prisma.enrollment.findUnique({
      where: { enrollment_id: id },
      select: { enrollment_id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Inscription introuvable : ${id}`);
    }
  }
}
