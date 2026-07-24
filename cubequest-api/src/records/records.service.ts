
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.worldRecord.findMany({
      where: { isCurrent: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getOne(id: string) {
    return this.prisma.worldRecord.findUnique({ where: { id } });
  }
}
