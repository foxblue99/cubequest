import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TrainingTrend {
  recentCount: number;
  averageTimeMs: number | null;
  bestTimeMs: number | null;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  trendDescription: string;
  completionRate: number; // 0-100
  streak: number;
}

@Injectable()
export class TrainingTrendService {
  constructor(private prisma: PrismaService) {}

  async getTrend(userId: string): Promise<TrainingTrend> {
    const results = await this.prisma.solveResult.findMany({
      where: { userId, finalTimeMs: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    if (results.length < 3) {
      return {
        recentCount: results.length,
        averageTimeMs: null,
        bestTimeMs: null,
        trend: 'insufficient_data',
        trendDescription: '数据不足，需要至少3次训练',
        completionRate: 0,
        streak: 0,
      };
    }

    const times = results.map(r => r.finalTimeMs!).filter(t => t != null);
    const avg = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
    const best = Math.min(...times);

    // Trend: compare first half vs second half
    const mid = Math.floor(times.length / 2);
    const older = times.slice(mid);
    const newer = times.slice(0, mid);
    const olderAvg = Math.round(older.reduce((a,b)=>a+b,0) / older.length);
    const newerAvg = Math.round(newer.reduce((a,b)=>a+b,0) / newer.length);
    const diff = olderAvg - newerAvg;

    let trend: TrainingTrend['trend'] = 'stable';
    let desc = '成绩保持稳定';
    if (diff > 3000) { trend = 'improving'; desc = `进步显著！平均提升${(diff/1000).toFixed(1)}s`; }
    else if (diff > 500) { trend = 'improving'; desc = '正在稳步提升'; }
    else if (diff < -2000) { trend = 'declining'; desc = '近期成绩有所下滑，需要调整训练'; }

    // Completion rate from DailyMission
    const missions = await this.prisma.dailyMission.findMany({
      where: { userId }, orderBy: { date: 'desc' }, take: 7,
    });
    const completed = missions.filter(m => m.completed).length;
    const rate = missions.length > 0 ? Math.round(completed / missions.length * 100) : 0;

    // Streak
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
      const hasSolve = await this.prisma.solveResult.findFirst({ where: { userId, createdAt: { gte: new Date(d) } } });
      if (hasSolve) streak++;
      else break;
    }

    return {
      recentCount: results.length,
      averageTimeMs: avg,
      bestTimeMs: best,
      trend,
      trendDescription: desc,
      completionRate: rate,
      streak,
    };
  }
}
