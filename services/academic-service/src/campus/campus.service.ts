import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Room } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

/** Champs communs renvoyés pour un campus (sans relations) */
const campusBaseSelect = {
  campus_id: true,
  campus_name: true,
  address: true,
  city: true,
  postal_code: true,
  region: true,
  campus_director: true,
  phone: true,
  email: true,
  capacity_students: true,
  opening_date: true,
  status: true,
} satisfies Prisma.CampusSelect;

/** Relations chargées pour le détail d'un campus */
const campusDetailInclude = {
  programs: {
    select: {
      program_id: true,
      program_name: true,
      program_type: true,
      duration_years: true,
      department: true,
      status: true,
    },
  },
  instructors: {
    select: {
      instructor_id: true,
      first_name: true,
      last_name: true,
      email: true,
      department: true,
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
  rooms: {
    select: {
      room_id: true,
      room_name: true,
      building: true,
      floor: true,
      capacity: true,
      room_type: true,
      status: true,
    },
  },
  _count: {
    select: {
      programs: true,
      instructors: true,
      students: true,
      rooms: true,
    },
  },
} satisfies Prisma.CampusInclude;

type CampusWithRelations = Prisma.CampusGetPayload<{
  include: typeof campusDetailInclude;
}>;

/**
 * Service métier — gestion des campus du groupe Novacampus.
 * Centralise les requêtes Prisma et le formatage des réponses API.
 */
@Injectable()
export class CampusService {
  constructor(private prisma: PrismaService) {}

  /** Liste tous les campus avec compteurs de relations */
  async findAll() {
    const campuses = await this.prisma.campus.findMany({
      select: {
        ...campusBaseSelect,
        _count: {
          select: {
            programs: true,
            instructors: true,
            students: true,
            rooms: true,
          },
        },
      },
      orderBy: { campus_name: 'asc' },
    });

    return campuses.map((campus) => this.formatCampusSummary(campus));
  }

  /** Détail d'un campus avec programmes, enseignants, étudiants et bâtiments */
  async findOne(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { campus_id: id },
      include: campusDetailInclude,
    });

    if (!campus) {
      throw new NotFoundException(`Campus introuvable : ${id}`);
    }

    return this.formatCampusDetail(campus);
  }

  /** Crée un nouveau campus */
  async create(dto: CreateCampusDto) {
    const campus = await this.prisma.campus.create({
      data: this.mapCreateDtoToPrisma(dto),
      include: campusDetailInclude,
    });

    return this.formatCampusDetail(campus);
  }

  /** Met à jour un campus existant */
  async update(id: string, dto: UpdateCampusDto) {
    await this.ensureExists(id);

    const campus = await this.prisma.campus.update({
      where: { campus_id: id },
      data: this.mapUpdateDtoToPrisma(dto),
      include: campusDetailInclude,
    });

    return this.formatCampusDetail(campus);
  }

  /** Vérifie l'existence d'un campus avant update/delete */
  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.campus.findUnique({
      where: { campus_id: id },
      select: { campus_id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Campus introuvable : ${id}`);
    }
  }

  /** Convertit le DTO de création vers CampusCreateInput Prisma */
  private mapCreateDtoToPrisma(dto: CreateCampusDto): Prisma.CampusCreateInput {
    return {
      campus_name: dto.campus_name,
      campus_director: dto.campus_director,
      phone: dto.phone,
      email: dto.email,
      capacity_students: dto.capacity_students,
      opening_date: dto.opening_date ? new Date(dto.opening_date) : undefined,
      status: dto.status,
      address: dto.adresse?.address,
      city: dto.adresse?.city,
      postal_code: dto.adresse?.postal_code,
      region: dto.adresse?.region,
    };
  }

  /** Convertit le DTO de mise à jour — seuls les champs fournis sont modifiés */
  private mapUpdateDtoToPrisma(dto: UpdateCampusDto): Prisma.CampusUpdateInput {
    const data: Prisma.CampusUpdateInput = {};

    if (dto.campus_name !== undefined) data.campus_name = dto.campus_name;
    if (dto.campus_director !== undefined)
      data.campus_director = dto.campus_director;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.capacity_students !== undefined)
      data.capacity_students = dto.capacity_students;
    if (dto.opening_date !== undefined)
      data.opening_date = new Date(dto.opening_date);
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.adresse) {
      if (dto.adresse.address !== undefined) data.address = dto.adresse.address;
      if (dto.adresse.city !== undefined) data.city = dto.adresse.city;
      if (dto.adresse.postal_code !== undefined)
        data.postal_code = dto.adresse.postal_code;
      if (dto.adresse.region !== undefined) data.region = dto.adresse.region;
    }

    return data;
  }

  /** Réponse allégée pour la liste */
  private formatCampusSummary(
    campus: Prisma.CampusGetPayload<{
      select: typeof campusBaseSelect & {
        _count: {
          select: {
            programs: true;
            instructors: true;
            students: true;
            rooms: true;
          };
        };
      };
    }>,
  ) {
    return {
      campus_id: campus.campus_id,
      campus_name: campus.campus_name,
      adresse: this.formatAddress(campus),
      campus_director: campus.campus_director,
      phone: campus.phone,
      email: campus.email,
      capacity_students: campus.capacity_students,
      opening_date: campus.opening_date,
      status: campus.status,
      counts: {
        programmes: campus._count.programs,
        enseignants: campus._count.instructors,
        etudiants: campus._count.students,
        salles: campus._count.rooms,
      },
    };
  }

  /** Réponse complète avec toutes les liaisons métier */
  private formatCampusDetail(campus: CampusWithRelations) {
    return {
      campus_id: campus.campus_id,
      campus_name: campus.campus_name,
      adresse: this.formatAddress(campus),
      campus_director: campus.campus_director,
      phone: campus.phone,
      email: campus.email,
      capacity_students: campus.capacity_students,
      opening_date: campus.opening_date,
      status: campus.status,
      programmes: campus.programs,
      enseignants: campus.instructors,
      etudiants: campus.students,
      batiments: this.groupRoomsByBuilding(campus.rooms),
      counts: {
        programmes: campus._count.programs,
        enseignants: campus._count.instructors,
        etudiants: campus._count.students,
        salles: campus._count.rooms,
      },
    };
  }

  /** Regroupe les salles par bâtiment pour la vue métier */
  private groupRoomsByBuilding(rooms: Pick<Room, 'building' | 'room_id' | 'room_name' | 'floor' | 'capacity' | 'room_type' | 'status'>[]) {
    const map = new Map<string, typeof rooms>();

    for (const room of rooms) {
      const buildingName = room.building?.trim() || 'Non renseigne';
      const existing = map.get(buildingName) ?? [];
      existing.push(room);
      map.set(buildingName, existing);
    }

    return Array.from(map.entries()).map(([building, salles]) => ({
      building,
      salles,
    }));
  }

  private formatAddress(campus: {
    address: string | null;
    city: string | null;
    postal_code: string | null;
    region: string | null;
  }) {
    return {
      address: campus.address,
      city: campus.city,
      postal_code: campus.postal_code,
      region: campus.region,
    };
  }
}
