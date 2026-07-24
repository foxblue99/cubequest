import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  async remember(userId: string, key: string, content: string, priority = 0, memoryType = 'GENERAL') {
    return this.prisma.aIMemory.create({ data: { userId, key, content, priority, memoryType } });
  }

  async recall(userId: string, key?: string, limit = 10) {
    return this.prisma.aIMemory.findMany({
      where: { userId, ...(key ? { key } : {}) },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  }

  async getContext(userId: string): Promise<string> {
    const memories = await this.prisma.aIMemory.findMany({
      where: { userId },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
    });
    if (!memories.length) return '';
    return `\n【AI对用户的记忆】\n${memories.map(m => `- [${m.memoryType}/${m.key}] ${m.content}`).join('\n')}\n`;
  }

  async upsert(userId: string, key: string, content: string, priority = 0, memoryType = 'GENERAL') {
    const existing = await this.prisma.aIMemory.findFirst({ where: { userId, key } });
    if (existing) {
      return this.prisma.aIMemory.update({
        where: { id: existing.id },
        data: { content, priority, memoryType },
      });
    }
    return this.remember(userId, key, content, priority, memoryType);
  }
}
