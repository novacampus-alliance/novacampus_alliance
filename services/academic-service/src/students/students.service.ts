import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const studentBaseSelect = {
  student_id: true,
  campus_id: true,
  program_id: true,
  first_name: true,
  last_name: true,
  email: true,
  status: true,
  birth_date: true,
  enrollment_year: true,
  payment_status: true,
  address: true,
  city: true,
  postal_code: true,
  emergency_contact: true,
  emergency_phone: true,
} satisfies Prisma.StudentSelect;

const studentDetailInclude = {
  campus: { select: { campus_id: true, campus_name: true, city: true } },
  program: {
    select: { program_id: true, program_name: true, program_type: true },
  },
  enrollments: {
    select: {
      enrollment_id: true,
      course_id: true,
      semester: true,
      academic_year: true,
      status: true,
      final_grade: true,
      attendance_rate: true,
      enrollment_date: true,
      course: {
        select: { course_id: true, course_name: true, course_code: true },
      },
    },
  },
  payments: {
    select: {
      payment_id: true,
      amount: true,
      status: true,
      due_date: true,
      payment_date: true,
      academic_year: true,
      semester: true,
    },
    orderBy: { due_date: 'desc' as const },
    take: 10,
  },
  _count: { select: { enrollments: true, payments: true } },
} satisfies Prisma.StudentInclude;

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: typeof studentDetailInclude;
}>;

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(campusId?: string, programId?: string) {
    const students = await this.prisma.student.findMany({
      where: {
        ...(campusId ? { campus_id: campusId } : {}),
        ...(programId ? { program_id: programId } : {}),
      },
      select: {
        ...studentBaseSelect,
        campus: { select: { campus_id: true, campus_name: true } },
        program: { select: { program_id: true, program_name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
    });

    return students.map((s) => ({
      ...s,
      counts: { inscriptions: s._count.enrollments },
    }));
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: id },
      include: studentDetailInclude,
    });
    if (!student) {
      throw new NotFoundException(`Etudiant introuvable : ${id}`);
    }
    return this.formatDetail(student);
  }

  async findDossier(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: id },
      include: studentDetailInclude,
    });
    if (!student) {
      throw new NotFoundException(`Etudiant introuvable : ${id}`);
    }
    return {
      student_id: student.student_id,
      identite: {
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        campus: student.campus,
        program: student.program,
        enrollment_year: student.enrollment_year,
        status: student.status,
        payment_status: student.payment_status,
      },
      inscriptions: student.enrollments,
      factures: student.payments,
      counts: {
        inscriptions: student._count.enrollments,
        factures: student._count.payments,
      },
    };
  }



  async create(dto: CreateStudentDto) {
    await this.ensureCampusExists(dto.campus_id);
    await this.ensureProgramExists(dto.program_id, dto.campus_id);

    const student = await this.prisma.student.create({
      data: {
        campus_id: dto.campus_id,
        program_id: dto.program_id,
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        status: dto.status,
        birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
        enrollment_year: dto.enrollment_year,
        payment_status: dto.payment_status,
        address: dto.address,
        city: dto.city,
        postal_code: dto.postal_code,
        emergency_contact: dto.emergency_contact,
        emergency_phone: dto.emergency_phone,
      },
      include: studentDetailInclude,
    });
    return this.formatDetail(student);
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.ensureExists(id);
    if (dto.campus_id) await this.ensureCampusExists(dto.campus_id);
    if (dto.program_id) {
      const campusId =
        dto.campus_id ??
        (
          await this.prisma.student.findUnique({
            where: { student_id: id },
            select: { campus_id: true },
          })
        )?.campus_id;
      if (campusId) await this.ensureProgramExists(dto.program_id, campusId);
    }

    const data: Prisma.StudentUpdateInput = {};
    if (dto.campus_id !== undefined)
      data.campus = { connect: { campus_id: dto.campus_id } };
    if (dto.program_id !== undefined)
      data.program = { connect: { program_id: dto.program_id } };
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.birth_date !== undefined)
      data.birth_date = new Date(dto.birth_date);
    if (dto.enrollment_year !== undefined)
      data.enrollment_year = dto.enrollment_year;
    if (dto.payment_status !== undefined)
      data.payment_status = dto.payment_status;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.postal_code !== undefined) data.postal_code = dto.postal_code;
    if (dto.emergency_contact !== undefined)
      data.emergency_contact = dto.emergency_contact;
    if (dto.emergency_phone !== undefined)
      data.emergency_phone = dto.emergency_phone;

    const student = await this.prisma.student.update({
      where: { student_id: id },
      data,
      include: studentDetailInclude,
    });
    return this.formatDetail(student);
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.student.findUnique({
      where: { student_id: id },
      select: { student_id: true },
    });
    if (!exists) throw new NotFoundException(`Etudiant introuvable : ${id}`);
  }

  private async ensureCampusExists(campusId: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { campus_id: campusId },
      select: { campus_id: true },
    });
    if (!campus)
      throw new UnprocessableEntityException(`Campus introuvable : ${campusId}`);
  }

  private async ensureProgramExists(programId: string, campusId: string) {
    const program = await this.prisma.program.findFirst({
      where: { program_id: programId, campus_id: campusId },
      select: { program_id: true },
    });
    if (!program) {
      throw new UnprocessableEntityException(
        `Programme introuvable pour ce campus : ${programId}`,
      );
    }
  }

  private formatDetail(student: StudentWithRelations) {
    return {
      ...student,
      counts: {
        inscriptions: student._count.enrollments,
        factures: student._count.payments,
      },
    };
  }
}
