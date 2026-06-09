import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

/** Champs de base d'un programme */
const programBaseSelect = {
  program_id: true,
  campus_id: true,
  program_name: true,
  program_type: true,
  duration_years: true,
  annual_tuition: true,
  department: true,
  coordinator: true,
  max_students: true,
  status: true,
} satisfies Prisma.ProgramSelect;

/** Relations chargées pour le détail d'un programme */
const programDetailInclude = {
  campus: {
    select: {
      campus_id: true,
      campus_name: true,
      city: true,
      status: true,
    },
  },
  students: {
    select: {
      student_id: true,
      first_name: true,
      last_name: true,
      email: true,
      enrollment_year: true,
      status: true,
      payment_status: true,
    },
  },
  courses: {
    select: {
      course_id: true,
      course_name: true,
      course_code: true,
      semester: true,
      credits: true,
      status: true,
    },
  },
  _count: {
    select: {
      students: true,
      courses: true,
    },
  },
} satisfies Prisma.ProgramInclude;

type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: typeof programDetailInclude;
}>;

/**
 * Service métier — gestion des programmes académiques (licence, master, etc.).
 */
@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste les programmes, avec filtre optionnel par campus.
   * @param campusId — si fourni, ne retourne que les programmes de ce campus
   */
  async findAll(campusId?: string) {
    const programs = await this.prisma.program.findMany({
      where: campusId ? { campus_id: campusId } : undefined,
      select: {
        ...programBaseSelect,
        campus: {
          select: { campus_id: true, campus_name: true },
        },
        _count: {
          select: { students: true, courses: true },
        },
      },
      orderBy: [{ campus: { campus_name: 'asc' } }, { program_name: 'asc' }],
    });

    return programs.map((program) => this.formatProgramSummary(program));
  }

  /** Détail d'un programme avec campus, étudiants et cours */
  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { program_id: id },
      include: programDetailInclude,
    });

    if (!program) {
      throw new NotFoundException(`Programme introuvable : ${id}`);
    }

    return this.formatProgramDetail(program);
  }

  /** Crée un nouveau programme rattaché à un campus */
  async create(dto: CreateProgramDto) {
    await this.ensureCampusExists(dto.campus_id);

    const program = await this.prisma.program.create({
      data: this.mapCreateDtoToPrisma(dto),
      include: programDetailInclude,
    });

    return this.formatProgramDetail(program);
  }

  /** Met à jour un programme existant */
  async update(id: string, dto: UpdateProgramDto) {
    await this.ensureProgramExists(id);

    if (dto.campus_id !== undefined) {
      await this.ensureCampusExists(dto.campus_id);
    }

    const program = await this.prisma.program.update({
      where: { program_id: id },
      data: this.mapUpdateDtoToPrisma(dto),
      include: programDetailInclude,
    });

    return this.formatProgramDetail(program);
  }

  private async ensureProgramExists(id: string): Promise<void> {
    const exists = await this.prisma.program.findUnique({
      where: { program_id: id },
      select: { program_id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Programme introuvable : ${id}`);
    }
  }

  /** Vérifie que le campus cible existe avant création/transfert */
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
    dto: CreateProgramDto,
  ): Prisma.ProgramCreateInput {
    return {
      program_name: dto.program_name,
      program_type: dto.program_type,
      duration_years: dto.duration_years,
      annual_tuition: dto.annual_tuition,
      department: dto.department,
      coordinator: dto.coordinator,
      max_students: dto.max_students,
      status: dto.status,
      campus: { connect: { campus_id: dto.campus_id } },
    };
  }

  private mapUpdateDtoToPrisma(
    dto: UpdateProgramDto,
  ): Prisma.ProgramUpdateInput {
    const data: Prisma.ProgramUpdateInput = {};

    if (dto.program_name !== undefined) data.program_name = dto.program_name;
    if (dto.program_type !== undefined) data.program_type = dto.program_type;
    if (dto.duration_years !== undefined)
      data.duration_years = dto.duration_years;
    if (dto.annual_tuition !== undefined)
      data.annual_tuition = dto.annual_tuition;
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.coordinator !== undefined) data.coordinator = dto.coordinator;
    if (dto.max_students !== undefined) data.max_students = dto.max_students;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.campus_id !== undefined) {
      data.campus = { connect: { campus_id: dto.campus_id } };
    }

    return data;
  }

  private formatProgramSummary(
    program: Prisma.ProgramGetPayload<{
      select: typeof programBaseSelect & {
        campus: { select: { campus_id: true; campus_name: true } };
        _count: { select: { students: true; courses: true } };
      };
    }>,
  ) {
    return {
      program_id: program.program_id,
      campus_id: program.campus_id,
      campus: program.campus,
      program_name: program.program_name,
      program_type: program.program_type,
      duration_years: program.duration_years,
      annual_tuition: program.annual_tuition,
      department: program.department,
      coordinator: program.coordinator,
      max_students: program.max_students,
      status: program.status,
      counts: {
        etudiants: program._count.students,
        cours: program._count.courses,
      },
    };
  }

  private formatProgramDetail(program: ProgramWithRelations) {
    return {
      program_id: program.program_id,
      campus_id: program.campus_id,
      campus: program.campus,
      program_name: program.program_name,
      program_type: program.program_type,
      duration_years: program.duration_years,
      annual_tuition: program.annual_tuition,
      department: program.department,
      coordinator: program.coordinator,
      max_students: program.max_students,
      status: program.status,
      etudiants: program.students,
      cours: program.courses,
      counts: {
        etudiants: program._count.students,
        cours: program._count.courses,
      },
    };
  }
}
