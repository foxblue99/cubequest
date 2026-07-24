import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const XP_RULES = {
  SOLVE_COMPLETE: 5,
  TASK_COMPLETE: 20,
  CHALLENGE_WIN: 50,
  PB_BREAK: 30,
  STREAK_3: 15,
  STREAK_7: 40,
} as const;

const TITLES: { minLevel: number; title: string; emoji: string }[] = [
  { minLevel: 1, title: '新手', emoji: '🌱' },
  { minLevel: 5, title: '入门', emoji: '🔰' },
  { minLevel: 10, title: 'CFOP探索者', emoji: '🧩' },
  { minLevel: 20, title: '速拧玩家', emoji: '⚡' },
  { minLevel: 35, title: '进阶高手', emoji: '💎' },
  { minLevel: 50, title: '魔方大师', emoji: '👑' },
  { minLevel: 75, title: '传说魔皇', emoji: '🔮' },
  { minLevel: 100, title: '超神至尊', emoji: '🌟' },
];

function calcLevel(xp: number): number {
  // XP formula: level = floor(sqrt(xp / 10))
  return Math.max(1, Math.floor(Math.sqrt(xp / 10)));
}

function getTitle(level: number): string {
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (level >= TITLES[i].minLevel) return TITLES[i].title;
  }
  return '新手';
}

@Injectable()
export class GrowthService {
  constructor(private prisma: PrismaService) {}

  /** Award XP to a user */
  async awardXP(userId: string, amount: number, reason: string) {
    const growth = await this.prisma.userGrowth.upsert({
      where: { userId },
      update: { xp: { increment: amount } },
      create: { userId, xp: amount, level: 1, title: '新手' },
    });
    const newXp = growth.xp + amount;
    const newLevel = calcLevel(newXp);
    const title = getTitle(newLevel);

    // Level up?
    if (newLevel > growth.level) {
      await this.prisma.userGrowth.update({
        where: { userId },
        data: { level: newLevel, title },
      });
      // Track level-up event
      await this.prisma.eventTracking.create({
        data: { userId, event: 'LEVEL_UP', metadata: JSON.stringify({ from: growth.level, to: newLevel, title }) },
      });
      return { leveledUp: true, newLevel, title, xp: newXp };
    }

    if (title !== growth.title) {
      await this.prisma.userGrowth.update({ where: { userId }, data: { title } });
    }

    await this.prisma.eventTracking.create({
      data: { userId, event: 'XP_GAIN', metadata: JSON.stringify({ amount, reason, totalXp: newXp }) },
    });

    return { leveledUp: false, newLevel, title, xp: newXp };
  }

  /** Get growth stats */
  async getGrowth(userId: string) {
    const growth = await this.prisma.userGrowth.findUnique({ where: { userId } });
    if (!growth) {
      const created = await this.prisma.userGrowth.create({ data: { userId, level: 1, xp: 0, title: '新手' } });
      return this.formatGrowth(created);
    }
    return this.formatGrowth(growth);
  }

  private formatGrowth(g: any) {
    const xpForNext = ((g.level + 1) ** 2) * 10;
    const xpForCurrent = (g.level ** 2) * 10;
    const progress = g.xp >= xpForCurrent ? Math.min(100, Math.round(((g.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)) : 0;
    return {
      level: g.level, xp: g.xp, title: g.title,
      nextLevelXp: xpForNext, currentLevelXp: xpForCurrent,
      progress,
      titles: TITLES,
    };
  }

  /** Award XP for solve */
  async onSolve(userId: string, isPB: boolean) {
    let total = XP_RULES.SOLVE_COMPLETE;
    if (isPB) total += XP_RULES.PB_BREAK;
    return this.awardXP(userId, total, isPB ? 'PB突破' : '完成还原');
  }
}
