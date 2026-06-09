import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseTimeToDate, timesOverlap } from '../common/utils/time.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomAvailabilityQueryDto } from './dto/room-availability-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

const roomDetailInclude = {
  campus: { select: { campus_id: true, campus_name: true, city: true } },
  courses: {
    select: { course_id: true, course_name: true, course_code: true },
  },
  schedules: {
    select: {
      schedule_id: true,
      day_of_week: true,
      start_time: true,
      end_time: true,
    },
  },
  _count: { select: { courses: true, schedules: true } },
} satisfies Prisma.RoomInclude;

type RoomWithRelations = Prisma.RoomGetPayload<{
  include: typeof roomDetailInclude;
}>;

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll(campusId?: string, building?: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        ...(campusId ? { campus_id: campusId } : {}),
        ...(building ? { building } : {}),
      },
      include: {
        campus: { select: { campus_id: true, campus_name: true } },
        _count: { select: { schedules: true } },
      },
      orderBy: [{ building: 'asc' }, { room_name: 'asc' }],
    });
    return rooms.map((r) => ({
      ...r,
      counts: { creneaux: r._count.schedules },
    }));
  }

  async findAvailable(query: RoomAvailabilityQueryDto) {
    const start = parseTimeToDate(query.start_time);
    const end = parseTimeToDate(query.end_time);

    const rooms = await this.prisma.room.findMany({
      where: {
        campus_id: query.campus_id,
        status: 'disponible',
      },
      include: {
        schedules: {
          where: {
            day_of_week: query.day_of_week,
            ...(query.academic_year
              ? { academic_year: query.academic_year }
              : {}),
          },
        },
      },
      orderBy: { room_name: 'asc' },
    });

    return rooms
      .filter((room) =>
        room.schedules.every(
          (s) =>
            !timesOverlap(start, end, s.start_time, s.end_time),
        ),
      )
      .map(({ schedules: _s, ...room }) => room);
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { room_id: id },
      include: roomDetailInclude,
    });
    if (!room) throw new NotFoundException(`Salle introuvable : ${id}`);
    return this.formatDetail(room);
  }

  async create(dto: CreateRoomDto) {
    await this.ensureCampusExists(dto.campus_id);
    const room = await this.prisma.room.create({
      data: {
        campus_id: dto.campus_id,
        room_name: dto.room_name,
        building: dto.building,
        floor: dto.floor,
        capacity: dto.capacity,
        room_type: dto.room_type,
        equipment: dto.equipment,
        status: dto.status,
      },
      include: roomDetailInclude,
    });
    return this.formatDetail(room);
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.ensureRoomExists(id);
    if (dto.campus_id) await this.ensureCampusExists(dto.campus_id);

    const data: Prisma.RoomUpdateInput = {};
    if (dto.campus_id !== undefined)
      data.campus = { connect: { campus_id: dto.campus_id } };
    if (dto.room_name !== undefined) data.room_name = dto.room_name;
    if (dto.building !== undefined) data.building = dto.building;
    if (dto.floor !== undefined) data.floor = dto.floor;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.room_type !== undefined) data.room_type = dto.room_type;
    if (dto.equipment !== undefined) data.equipment = dto.equipment;
    if (dto.status !== undefined) data.status = dto.status;

    const room = await this.prisma.room.update({
      where: { room_id: id },
      data,
      include: roomDetailInclude,
    });
    return this.formatDetail(room);
  }

  private async ensureRoomExists(id: string) {
    const exists = await this.prisma.room.findUnique({
      where: { room_id: id },
      select: { room_id: true },
    });
    if (!exists) throw new NotFoundException(`Salle introuvable : ${id}`);
  }

  private async ensureCampusExists(campusId: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { campus_id: campusId },
      select: { campus_id: true },
    });
    if (!campus)
      throw new UnprocessableEntityException(`Campus introuvable : ${campusId}`);
  }

  private formatDetail(room: RoomWithRelations) {
    return {
      ...room,
      counts: {
        cours: room._count.courses,
        creneaux: room._count.schedules,
      },
    };
  }
}
