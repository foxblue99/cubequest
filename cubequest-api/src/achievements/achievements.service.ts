
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async getMyAchievements(userId: string) {
    const all = await this.prisma.achievement.findMany({ where: { active: true } });
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    return all.map((a) => ({
      ...a,
      unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt || null,
    }));
  }

  async checkAndUnlock(userId: string, code: string) {
    const achievement = await this.prisma.achievement.findUnique({ where: { code } });
    if (!achievement) return;

    const existing = await this.prisma.userAchievement.findFirst({
      where: { userId, achievementId: achievement.id },
    });
    if (existing) return;

    return this.prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
  }
}
