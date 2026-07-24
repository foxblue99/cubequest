import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { translateWcaName } from './wca-translate';

@Injectable()
export class WcaSyncCron {
  private readonly logger = new Logger(WcaSyncCron.name);
  constructor(private prisma: PrismaService) {}

  @Cron('0 6 * * *', { timeZone: 'Asia/Shanghai' })
  async syncWcaCompetitions() {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`https://www.worldcubeassociation.org/api/v0/competitions?country_iso2=CN&start=${today}`);
      if (!res.ok) { this.logger.warn(`WCA API ${res.status}`); return; }
      const comps = await res.json();

      for (const c of comps) {
        const { nameZh, cityZh } = translateWcaName(c.name, c.city);
        await this.prisma.wcaCompetitionCache.upsert({
          where: { id: c.id },
          update: {
            name: c.name, nameZh, city: c.city, cityZh, venue: c.venue ?? null,
            startDate: new Date(c.start_date), endDate: new Date(c.end_date),
            registrationOpen: c.registration_open ? new Date(c.registration_open) : null,
            registrationClose: c.registration_close ? new Date(c.registration_close) : null,
            wcaUrl: c.url, eventIds: (c.event_ids || []).join(','),
            syncedAt: new Date(),
          },
          create: {
            id: c.id, name: c.name, nameZh, city: c.city, cityZh, venue: c.venue ?? null,
            startDate: new Date(c.start_date), endDate: new Date(c.end_date),
            registrationOpen: c.registration_open ? new Date(c.registration_open) : null,
            registrationClose: c.registration_close ? new Date(c.registration_close) : null,
            wcaUrl: c.url, eventIds: (c.event_ids || []).join(','),
          },
        });
      }
      this.logger.log(`WCA 同步: ${comps.length} 场`);
    } catch (err) {
      this.logger.error('WCA 同步失败', err);
    }
  }
}
