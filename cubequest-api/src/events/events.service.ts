import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(city?: string, status?: string) {
    const where: any = {};
    if (city) where.city = city;
    if (status) where.status = status;
    return this.prisma.event.findMany({ where, orderBy: { startDate: 'asc' } });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  // WCA + Local + Legacy Events merged calendar
  async getCalendar(city?: string, month?: string) {
    const now = new Date();

    const wca = await this.prisma.wcaCompetitionCache.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: 'asc' },
    });

    const local = await this.prisma.localEventPost.findMany({
      orderBy: { startDate: 'asc' },
    });

    // Legacy Event model (read-only, no registration/submit)
    const legacyEvents = await this.prisma.event.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: 'asc' },
    });

    return [
      ...wca.map(c => ({ ...c, source: 'WCA', type: 'wca' })),
      ...local.map(l => ({ ...l, source: 'MANUAL', type: 'local' })),
      ...legacyEvents.map(e => ({
        id: e.id, name: e.title, city: e.city ?? '',
        startDate: e.startDate, endDate: e.endDate,
        description: e.description, externalUrl: null, eventIds: null,
        source: 'MANUAL', type: 'local',
      })),
    ].sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  // Admin: create local event post
  async createLocalEvent(dto: any, createdBy: string) {
    return this.prisma.localEventPost.create({
      data: {
        title: dto.title, city: dto.city, startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        description: dto.description, externalUrl: dto.externalUrl, createdBy,
      },
    });
  }
}
