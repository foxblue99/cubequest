
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FormulasService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, keyword?: string, level?: string) {
    const where: any = { published: true };
    if (category) where.category = category;
    if (keyword) where.name = { contains: keyword };
    if (level) where.level = level;

    return this.prisma.formula.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string, userId?: string) {
    const formula = await this.prisma.formula.findUnique({ where: { id } });
    if (!formula || !userId) return formula;

    const progress = await this.prisma.formulaProgress.findFirst({
      where: { userId, formulaId: id },
    });

    return { ...formula, status: progress?.status || 'NOT_LEARNED', isFavorite: progress?.isFavorite || false };
  }

  async updateProgress(userId: string, formulaId: string, status: string) {
    const existing = await this.prisma.formulaProgress.findFirst({
      where: { userId, formulaId },
    });

    if (existing) {
      return this.prisma.formulaProgress.update({
        where: { id: existing.id },
        data: { status, practicedCount: existing.practicedCount + 1, lastPracticedAt: new Date() },
      });
    }

    return this.prisma.formulaProgress.create({
      data: { userId, formulaId, status, practicedCount: 1, lastPracticedAt: new Date() },
    });
  }

  async toggleFavorite(userId: string, formulaId: string) {
    const existing = await this.prisma.formulaProgress.findFirst({
      where: { userId, formulaId },
    });

    if (existing) {
      return this.prisma.formulaProgress.update({
        where: { id: existing.id },
        data: { isFavorite: !existing.isFavorite },
      });
    }

    return this.prisma.formulaProgress.create({
      data: { userId, formulaId, isFavorite: true },
    });
  }

  async removeFavorite(userId: string, formulaId: string) {
    const existing = await this.prisma.formulaProgress.findFirst({
      where: { userId, formulaId },
    });
    if (existing) {
      return this.prisma.formulaProgress.update({
        where: { id: existing.id },
        data: { isFavorite: false },
      });
    }
    return { success: true };
  }
}
