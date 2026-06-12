import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

/** Champs de base d'un enseignant */
const instructorBaseSelect = {
  instructor_id: true,
  campus_id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  department: true,
  specialization: true,
  hire_date: true,
  status: true,
} satisfies Prisma.InstructorSelect;

/** Relations chargées pour le détail (affectation aux cours) */
const instructorDetailInclude = {
  campus: {
    select: {
      campus_id: true,
      campus_name: true,
      city: true,
      status: true,
    },
  },
  courses: {
    select: {
      course_id: true,
      course_name: true,
      course_code: true,
      semester: true,
      credits: true,
      hours_total: true,
      status: true,
      program: {
        select: {
          program_id: true,
          program_name: true,
        },
      },
    },
    orderBy: [{ semester: 'asc' }, { course_name: 'asc' }],
  },
  schedules: {
    select: {
      schedule_id: true,
      day_of_week: true,
      start_time: true,
      end_time: true,
      course: {
        select: {
          course_id: true,
          course_name: true,
          course_code: true,
        },
      },
      room: {
        select: {
          room_id: true,
          room_name: true,
          building: true,
        },
      },
    },
  },
  _count: {
    select: {
      courses: true,
      schedules: true,
    },
  },
} satisfies Prisma.InstructorInclude;

type InstructorWithRelations = Prisma.InstructorGetPayload<{
  include: typeof instructorDetailInclude;
}>;

/**
 * Service métier — gestion des enseignants du groupe Novacampus.
 * Inclut les cours assignés (affectation pédagogique).
 */
@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste les enseignants, avec filtre optionnel par campus.
   * @param campusId — si fourni, ne retourne que les enseignants de ce campus
   */
  async findAll(campusId?: string, email?: string) {
    const instructors = await this.prisma.instructor.findMany({
      where: {
        ...(campusId ? { campus_id: campusId } : {}),
        ...(email ? { email: { equals: email, mode: 'insensitive' } } : {}),
      },
      select: {
        ...instructorBaseSelect,
        campus: {
          select: { campus_id: true, campus_name: true },
        },
        _count: {
          select: { courses: true, schedules: true },
        },
      },
      orderBy: [
        { campus: { campus_name: 'asc' } },
        { last_name: 'asc' },
        { first_name: 'asc' },
      ],
    });

    return instructors.map((instructor) =>
      this.formatInstructorSummary(instructor),
    );
  }

  /** Détail d'un enseignant avec campus, cours assignés et créneaux */
  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
      include: instructorDetailInclude,
    });

    if (!instructor) {
      throw new NotFoundException(`Enseignant introuvable : ${id}`);
    }

    return this.formatInstructorDetail(instructor);
  }

  /** Crée un enseignant rattaché à un campus */
  async create(dto: CreateInstructorDto) {
    await this.ensureCampusExists(dto.campus_id);

    const instructor = await this.prisma.instructor.create({
      data: this.mapCreateDtoToPrisma(dto),
      include: instructorDetailInclude,
    });

    return this.formatInstructorDetail(instructor);
  }

  /** Met à jour un enseignant existant */
  async update(id: string, dto: UpdateInstructorDto) {
    await this.ensureInstructorExists(id);

    if (dto.campus_id !== undefined) {
      await this.ensureCampusExists(dto.campus_id);
    }

    const instructor = await this.prisma.instructor.update({
      where: { instructor_id: id },
      data: this.mapUpdateDtoToPrisma(dto),
      include: instructorDetailInclude,
    });

    return this.formatInstructorDetail(instructor);
  }

  private async ensureInstructorExists(id: string): Promise<void> {
    const exists = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
      select: { instructor_id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Enseignant introuvable : ${id}`);
    }
  }

  private async ensureCampusExists(campusId: string): Promise<void> {
    const campus = await this.prisma.campus.findUnique({
      where: { campus_id: campusId },
      select: { campus_id: true },
    });

    if (!campus) {
      throw new UnprocessableEntityException(
        `Campus introuvable : ${campusId}`,
      );
    }
  }

  private mapCreateDtoToPrisma(
    dto: CreateInstructorDto,
  ): Prisma.InstructorCreateInput {
    return {
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone: dto.phone,
      department: dto.department,
      specialization: dto.specialization,
      hire_date: dto.hire_date ? new Date(dto.hire_date) : undefined,
      status: dto.status,
      campus: { connect: { campus_id: dto.campus_id } },
    };
  }

  private mapUpdateDtoToPrisma(
    dto: UpdateInstructorDto,
  ): Prisma.InstructorUpdateInput {
    const data: Prisma.InstructorUpdateInput = {};

    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.specialization !== undefined)
      data.specialization = dto.specialization;
    if (dto.hire_date !== undefined)
      data.hire_date = new Date(dto.hire_date);
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.campus_id !== undefined) {
      data.campus = { connect: { campus_id: dto.campus_id } };
    }

    return data;
  }

  private formatInstructorSummary(
    instructor: Prisma.InstructorGetPayload<{
      select: typeof instructorBaseSelect & {
        campus: { select: { campus_id: true; campus_name: true } };
        _count: { select: { courses: true; schedules: true } };
      };
    }>,
  ) {
    return {
      instructor_id: instructor.instructor_id,
      campus_id: instructor.campus_id,
      campus: instructor.campus,
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email,
      phone: instructor.phone,
      department: instructor.department,
      specialization: instructor.specialization,
      hire_date: instructor.hire_date,
      status: instructor.status,
      counts: {
        cours: instructor._count.courses,
        creneaux: instructor._count.schedules,
      },
    };
  }

  private formatInstructorDetail(instructor: InstructorWithRelations) {
    return {
      instructor_id: instructor.instructor_id,
      campus_id: instructor.campus_id,
      campus: instructor.campus,
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email,
      phone: instructor.phone,
      department: instructor.department,
      specialization: instructor.specialization,
      hire_date: instructor.hire_date,
      status: instructor.status,
      cours: instructor.courses,
      creneaux: instructor.schedules,
      counts: {
        cours: instructor._count.courses,
        creneaux: instructor._count.schedules,
      },
    };
  }
}
