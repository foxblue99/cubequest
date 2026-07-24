import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsightService {
  constructor(private prisma: PrismaService) {}

  /** Dashboard overview metrics */
  async dashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const [totalUsers, activeUsers, totalSolves, todaySolves, weekSolves,
      totalCourses, totalFormulas, totalPosts, totalEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.solveResult.groupBy({ by: ['userId'], where: { createdAt: { gte: weekAgo } } }).then(r => r.length),
      this.prisma.solveResult.count(),
      this.prisma.solveResult.count({ where: { createdAt: { gte: today } } }),
      this.prisma.solveResult.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.course.count(),
      this.prisma.formula.count(),
      this.prisma.tribePost.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.event.count({ where: { status: 'UPCOMING' } }),
    ]);

    // Recent registrations trend (last 7 days)
    const regs = await this.prisma.user.findMany({
      select: { createdAt: true },
      where: { createdAt: { gte: weekAgo } },
      orderBy: { createdAt: 'asc' },
    });
    const dailyRegs: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
      dailyRegs[d] = 0;
    }
    for (const r of regs) {
      const d = r.createdAt.toISOString().split('T')[0];
      if (dailyRegs[d] !== undefined) dailyRegs[d]++;
    }

    return {
      metrics: { totalUsers, activeUsers, totalSolves, todaySolves, weekSolves, totalCourses, totalFormulas, totalPosts, totalEvents },
      trends: { dailyRegistrations: dailyRegs },
    };
  }

  /** Solve trend data */
  async solveTrend() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const data: { date: string; count: number; avgMs: number | null; bestMs: number | null }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const next = new Date(d.getTime() + 86400000);
      const results = await this.prisma.solveResult.findMany({
        where: { createdAt: { gte: d, lt: next }, finalTimeMs: { not: null } },
        select: { finalTimeMs: true },
      });
      const times = results.map(r => r.finalTimeMs!);
      data.push({
        date: d.toISOString().split('T')[0],
        count: times.length,
        avgMs: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
        bestMs: times.length > 0 ? Math.min(...times) : null,
      });
    }
    return data;
  }

  /** Anomaly detection */
  async anomalies() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const alerts: { type: string; severity: 'info' | 'warning' | 'critical'; message: string }[] = [];

    // Check solve volume drop
    const [todayCount, yesterdayCount] = await Promise.all([
      this.prisma.solveResult.count({ where: { createdAt: { gte: today } } }),
      this.prisma.solveResult.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    ]);
    if (yesterdayCount > 0 && todayCount < yesterdayCount * 0.3) {
      alerts.push({ type: 'volume_drop', severity: 'warning', message: `今日还原量(${todayCount})较昨日(${yesterdayCount})大幅下降` });
    }

    // Check new user drop
    const [weekNewUsers, prevWeekNewUsers] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: new Date(weekAgo.getTime() - 7 * 86400000), lt: weekAgo } } }),
    ]);
    if (prevWeekNewUsers > 0 && weekNewUsers < prevWeekNewUsers * 0.5) {
      alerts.push({ type: 'user_drop', severity: 'warning', message: `本周新注册(${weekNewUsers})较上周(${prevWeekNewUsers})下降超50%` });
    }

    // Check courses without lessons
    const emptyCourses = await this.prisma.course.findMany({
      where: { published: true },
      select: { id: true, title: true, _count: { select: { lessons: true } } },
    });
    const noLessonCourses = emptyCourses.filter(c => c._count.lessons === 0);
    if (noLessonCourses.length > 0) {
      alerts.push({ type: 'empty_course', severity: 'info', message: `${noLessonCourses.length}门已发布课程无课时内容` });
    }

    return alerts;
  }

  /** User rankings by solves */
  async topSolvers() {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const results = await this.prisma.solveResult.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const top10 = results.slice(0, 10);
    const users = await this.prisma.user.findMany({
      where: { id: { in: top10.map(r => r.userId) } },
      select: { id: true, nickname: true },
    });
    return top10.map(r => ({
      user: users.find(u => u.id === r.userId),
      solves: r._count.id,
    }));
  }

  /** Smart content recommendations */
  async getRecommendations() {
    // Most popular courses
    const popularCourses = await this.prisma.course.findMany({
      where: { published: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, mainCategory: true, level: true },
    });

    // Least viewed formulas that are high value
    const formulas = await this.prisma.formula.findMany({
      where: { published: true },
      take: 5,
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, mainCategory: true, level: true, moves: true },
    });

    // User segments
    const [totalUsers, newbieCount, advancedCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'STUDENT', studentProfile: { bestSingleMs: { lte: 20000 } } } }),
    ]);

    return {
      popularCourses,
      recentFormulas: formulas,
      userSegments: { totalUsers, students: newbieCount, advanced: advancedCount },
      suggestions: [
        advancedCount > 0 ? `${advancedCount}名学员达到Sub-20，可推送高级CFOP课程` : '暂无进阶学员',
        '本周热门：三阶基础入门课程',
        '建议推广分段计时功能提升训练质量',
      ],
    };
  }
}
