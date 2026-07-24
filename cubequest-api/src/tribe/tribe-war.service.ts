import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../results/ranking.service';
import { getShanghaiWeekKey, getShanghaiWeekStart } from '../common/date-utils';

function weekKey(): string { return getShanghaiWeekKey(); }

const DEFAULT_TEAMS = [
  { name: '凤凰战队', emoji: '🔥' },
  { name: '神龙战队', emoji: '🐉' },
  { name: '战狼战队', emoji: '🐺' },
];

@Injectable()
export class TribeWarService {
  constructor(private prisma: PrismaService, private ranking: RankingService) {}

  async ensureTeams() {
    const count = await this.prisma.team.count();
    if (count === 0) {
      for (const t of DEFAULT_TEAMS) {
        await this.prisma.team.create({ data: { name: t.name, emoji: t.emoji } });
      }
    }
  }

  async getStandings() {
    await this.ensureTeams();
    const wk = weekKey();
    // Ensure weekly scores exist
    const teams = await this.prisma.team.findMany();
    for (const t of teams) {
      await this.prisma.teamWeeklyScore.upsert({
        where: { teamId_weekKey: { teamId: t.id, weekKey: wk } },
        update: {}, create: { teamId: t.id, weekKey: wk, score: 0, status: 'OPEN' },
      });
    }

    const scores = await this.prisma.teamWeeklyScore.findMany({
      where: { weekKey: wk },
      include: { team: true },
      orderBy: { score: 'desc' },
    });

    const memberCounts = await Promise.all(teams.map(async t => ({
      teamId: t.id,
      count: await this.prisma.teamMembership.count({ where: { teamId: t.id } }),
    })));
    const countMap = new Map(memberCounts.map(m => [m.teamId, m.count]));

    return scores.map((s, i) => ({
      rank: i + 1,
      teamId: s.teamId,
      name: s.team.name,
      emoji: s.team.emoji,
      score: s.score,
      members: countMap.get(s.teamId) || 0,
      status: s.status,
    }));
  }

  async joinTeam(userId: string, teamId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.teamMembership.findUnique({ where: { userId } });
      if (existing) {
        await tx.teamMembership.delete({ where: { id: existing.id } });
      }
      return tx.teamMembership.create({ data: { teamId, userId } });
    });
  }

  async getMyTeam(userId: string) {
    const membership = await this.prisma.teamMembership.findUnique({
      where: { userId },
      include: { team: true },
    });
    if (!membership) return null;
    const wk = weekKey();
    const score = await this.prisma.teamWeeklyScore.findUnique({
      where: { teamId_weekKey: { teamId: membership.teamId, weekKey: wk } },
    });
    const standings = await this.getStandings();
    const rank = standings.find(s => s.teamId === membership.teamId)?.rank || 0;
    return {
      team: membership.team,
      weekKey: wk,
      score: score?.score || 0,
      rank,
    };
  }

  /** Manual weekly settlement trigger (cron replacement until @nestjs/schedule is added) */
  async settleWeek() {
    await this.ensureTeams();
    const wk = weekKey();
    const teams = await this.prisma.team.findMany();

    for (const team of teams) {
      const members = await this.prisma.teamMembership.findMany({ where: { teamId: team.id } });
      let totalScore = 0;

      for (const m of members) {
        // Count HEURISTIC+ non-flagged solves for scoring
        const validSolves = await this.prisma.solveResult.count({
          where: {
            userId: m.userId,
            createdAt: { gte: this.getWeekStart() },
            finalTimeMs: { not: null },
            verificationLevel: { in: ['HEURISTIC', 'VIDEO', 'SMARTCUBE'] },
            flagReason: null,
          },
        });
        totalScore += validSolves * 5;
      }

      await this.prisma.teamWeeklyScore.upsert({
        where: { teamId_weekKey: { teamId: team.id, weekKey: wk } },
        update: { score: totalScore, status: 'CLOSED' },
        create: { teamId: team.id, weekKey: wk, score: totalScore, status: 'CLOSED' },
      });
    }

    // Create war report (skip system post until system account is created)
    // TODO: create system user account for automated posts
    const standings = await this.getStandings();
    return { settled: true, standings };
  }

  private getWeekStart(): Date {
    return getShanghaiWeekStart();
  }
}
