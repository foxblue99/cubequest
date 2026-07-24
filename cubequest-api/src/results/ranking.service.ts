import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseWeekKeyRange } from '../common/date-utils';

export type RankingScope = 'HERO_BOARD' | 'DAILY_CHALLENGE' | 'TRIBE_WAR' | 'EVENT';
export type RankingMethod = 'AO100' | 'AO5' | 'AO12' | 'BEST_SINGLE';

export interface RankingQuery {
  scope: RankingScope;
  window: { days?: number; weekKey?: string };
  minVerificationLevel: 'CASUAL' | 'HEURISTIC' | 'VIDEO' | 'SMARTCUBE';
  method: RankingMethod;
  minSampleCount?: number;
  eventType?: string;
  excludeFlagged?: boolean;
}

export interface RankingEntry {
  rank?: number;
  userId: string;
  nickname: string;
  value: number;
  sampleCount: number;
  timeFormatted: string;
  verificationLevel: string;
}

/** Compute AO100: sort, drop top/bottom 10%, average the middle. Requires >= 100 samples. */
function ao100(times: number[]): number | null {
  if (times.length < 100) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const drop = Math.floor(sorted.length * 0.1);
  const trimmed = sorted.slice(drop, sorted.length - drop);
  if (trimmed.length === 0) return null;
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

function ao5(times: number[]): number | 'DNF' | null {
  if (times.length < 5) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

function ao12(times: number[]): number | 'DNF' | null {
  if (times.length < 12) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

function bestSingle(times: number[]): number | null {
  if (times.length === 0) return null;
  return Math.min(...times);
}

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async getRanking(query: RankingQuery): Promise<RankingEntry[]> {
    const { window: w, minVerificationLevel, method, minSampleCount, eventType, excludeFlagged } = query;

    // Build date filter
    const dateFilter: any = {};
    if (w.days) {
      const since = new Date(Date.now() - w.days * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { gte: since };
    }
    if (w.weekKey) {
      const { start, end } = parseWeekKeyRange(w.weekKey);
      dateFilter.createdAt = { gte: start, lt: end };
    }

    // Base where clause
    const where: any = {
      finalTimeMs: { not: null },
      ...dateFilter,
    };

    if (eventType) where.eventType = eventType;

    // Verification level: for HEURISTIC, match HEURISTIC and above; for CASUAL, match all
    if (minVerificationLevel === 'HEURISTIC') {
      where.verificationLevel = { in: ['HEURISTIC', 'VIDEO', 'SMARTCUBE'] };
    } else if (minVerificationLevel === 'VIDEO') {
      where.verificationLevel = { in: ['VIDEO', 'SMARTCUBE'] };
    } else if (minVerificationLevel === 'SMARTCUBE') {
      where.verificationLevel = 'SMARTCUBE';
    }
    // CASUAL: no filter (includes all levels)

    const results = await this.prisma.solveResult.findMany({
      where,
      orderBy: { finalTimeMs: 'asc' },
      select: { userId: true, finalTimeMs: true, verificationLevel: true, flagReason: true, createdAt: true },
    });

    // Group by userId
    const userTimes = new Map<string, number[]>();
    for (const r of results) {
      if (!r.finalTimeMs) continue;
      if (excludeFlagged && r.flagReason) continue;
      const arr = userTimes.get(r.userId) || [];
      arr.push(r.finalTimeMs);
      userTimes.set(r.userId, arr);
    }

    // Compute ranking value per user
    const entries: (RankingEntry & { times: number[] })[] = [];
    for (const [userId, times] of userTimes) {
      const sampleCount = times.length;
      if (minSampleCount && sampleCount < minSampleCount) continue;

      let value: number | 'DNF' | null = null;
      if (method === 'AO100') value = ao100(times);
      else if (method === 'AO5') value = ao5(times);
      else if (method === 'AO12') value = ao12(times);
      else value = bestSingle(times);

      if (value === null || value === 'DNF') continue;
      entries.push({ userId, nickname: '', value: value as number, sampleCount, timeFormatted: '', verificationLevel: '', times });
    }

    // Sort ascending (lower is better)
    entries.sort((a, b) => a.value - b.value);

    // Batch fetch nicknames
    const userIds = entries.map(e => e.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true },
    });
    const nameMap = new Map(users.map(u => [u.id, u.nickname]));

    // Get actual verification levels from results
    const verLevels = await this.prisma.solveResult.groupBy({
      by: ['userId', 'verificationLevel'],
      where: { userId: { in: userIds }, ...where },
      _count: true,
    });
    const bestLevel = new Map<string, string>();
    const order = ['SMARTCUBE', 'VIDEO', 'HEURISTIC', 'CASUAL'];
    for (const r of verLevels) {
      const current = bestLevel.get(r.userId) || 'CASUAL';
      if (order.indexOf(r.verificationLevel) < order.indexOf(current)) {
        bestLevel.set(r.userId, r.verificationLevel);
      }
    }

    return entries.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      nickname: nameMap.get(e.userId) || '未知',
      value: e.value,
      sampleCount: e.sampleCount,
      timeFormatted: `${(e.value / 1000).toFixed(2)}s`,
      verificationLevel: bestLevel.get(e.userId) || 'CASUAL',
    }));
  }
}
