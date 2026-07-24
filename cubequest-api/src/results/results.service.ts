import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrowthService } from '../growth/growth.service';
import { SkillEngineService } from '../ai/skill-engine.service';
import { VerificationLevel } from '@prisma/client';

function getFinalTime(timeMs: number | null, penalty: string): number | null {
  if (penalty === 'DNF' || timeMs === null) return null;
  if (penalty === 'PLUS_TWO') return timeMs + 2000;
  return timeMs;
}

function calcAverage(results: any[], count: number): number | 'DNF' | null {
  if (results.length < count) return null;
  const recent = results.slice(0, count);
  const values = recent.map((r) => {
    if (r.penalty === 'DNF' || r.timeMs === null) return Infinity;
    return r.penalty === 'PLUS_TWO' ? r.timeMs + 2000 : r.timeMs;
  });
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  if (trimmed.includes(Infinity)) return 'DNF';
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

// In-memory session store (server timing)
const sessions = new Map<string, { userId: string; startMs: number; expiresAt: number }>();
const TIMING_TOLERANCE_MS = 700;

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);
  constructor(private prisma: PrismaService, private growth: GrowthService, private skillEngine: SkillEngineService) {}

  /** Server timing: start a timed session */
  startSession(userId: string): { sessionToken: string } {
    const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessions.set(token, { userId, startMs: Date.now(), expiresAt: Date.now() + 120_000 });
    return { sessionToken: token };
  }

  /** Server timing: finish and compute verification */
  async finishWithTiming(userId: string, data: { sessionToken: string; scramble: string; timeMs: number; penalty: string; crossMs?: number; f2lMs?: number; ollMs?: number; pllMs?: number; note?: string; activityId?: string }) {
    const sess = sessions.get(data.sessionToken);
    if (!sess || sess.userId !== userId || Date.now() > sess.expiresAt) {
      // Session invalid/expired — fall back to CASUAL
      return this.create(userId, data, 'CASUAL', 'SESSION_EXPIRED');
    }
    sessions.delete(data.sessionToken);

    const serverElapsedMs = Date.now() - sess.startMs;
    const frontendMs = data.timeMs;
    const timingMatch = Math.abs(serverElapsedMs - frontendMs) <= TIMING_TOLERANCE_MS;

    let flagReason: string | null = timingMatch ? null : 'TIMING_MISMATCH';
    let verificationLevel: VerificationLevel = timingMatch ? 'CASUAL' : 'CASUAL'; // start CASUAL, upgrade later

    // Anomaly detection: check against user's ao50
    if (!flagReason && frontendMs > 0) {
      const recent50 = await this.prisma.solveResult.findMany({
        where: { userId, finalTimeMs: { not: null } }, orderBy: { createdAt: 'desc' }, take: 50,
      });
      if (recent50.length >= 10) {
        const times = recent50.map(r => r.finalTimeMs!).filter(t => t != null);
        const ao50 = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
        if (frontendMs < ao50 * 0.6) {
          flagReason = 'ANOMALY_VS_BASELINE';
        }
      }
    }

    // Upgrade to HEURISTIC if timing matches + no anomaly
    if (timingMatch && !flagReason) {
      verificationLevel = 'HEURISTIC';
    }

    return this.create(userId, { ...data, activityId: data.activityId }, verificationLevel, flagReason);
  }

  async create(userId: string, data: { eventType?: string; scramble: string; timeMs: number; penalty: string; note?: string; crossMs?: number; f2lMs?: number; ollMs?: number; pllMs?: number; activityId?: string }, verificationLevel: VerificationLevel = 'CASUAL', flagReason: string | null = null) {
    const finalTimeMs = getFinalTime(data.timeMs, data.penalty);
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    const isPB = finalTimeMs !== null && (!profile?.bestSingleMs || finalTimeMs < profile.bestSingleMs);

    const result = await this.prisma.solveResult.create({
      data: {
        userId, eventType: data.eventType || '333', scramble: data.scramble,
        timeMs: data.timeMs, penalty: data.penalty || 'NONE', finalTimeMs,
        crossMs: data.crossMs ?? null, f2lMs: data.f2lMs ?? null,
        ollMs: data.ollMs ?? null, pllMs: data.pllMs ?? null, isPB, note: data.note,
        verificationLevel, flagReason, flaggedAt: flagReason ? new Date() : null,
        activityId: data.activityId ?? null,
      },
    });

    if (isPB && finalTimeMs !== null) {
      await this.prisma.studentProfile.upsert({
        where: { userId }, update: { bestSingleMs: finalTimeMs }, create: { userId, bestSingleMs: finalTimeMs },
      });
    }

    this.growth.onSolve(userId, isPB).catch(err => console.error('[Growth XP] Failed:', err));

    // V3.6.1: Async skill computation — never blocks the main flow
    this.skillEngine.computeAndSave(userId).catch(err => {
      this.logger.error(`Skill compute failed for ${userId}: ${(err as Error)?.message || 'unknown'}`, (err as Error)?.stack?.slice(0, 200));
    });

    const recentResults = await this.prisma.solveResult.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 12,
    });
    const pb = profile?.bestSingleMs;
    const ao5 = calcAverage(recentResults, 5);
    const ao12 = calcAverage(recentResults, 12);

    if (typeof ao5 === 'number' && (!profile?.bestAo5Ms || ao5 < profile.bestAo5Ms)) {
      await this.prisma.studentProfile.upsert({ where: { userId }, update: { bestAo5Ms: ao5 }, create: { userId, bestAo5Ms: ao5 } });
    }
    if (typeof ao12 === 'number' && (!profile?.bestAo12Ms || ao12 < profile.bestAo12Ms)) {
      await this.prisma.studentProfile.upsert({ where: { userId }, update: { bestAo12Ms: ao12 }, create: { userId, bestAo12Ms: ao12 } });
    }

    return { result, stats: { pb, ao5, ao12 }, verificationLevel, flagReason };
  }

  async getMyResults(userId: string, limit = 50) {
    return this.prisma.solveResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: +limit });
  }

  async getMyStats(userId: string) {
    const results = await this.prisma.solveResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return {
      pb: profile?.bestSingleMs || null,
      ao5: profile?.bestAo5Ms ? calcAverage(results, 5) : null,
      ao12: profile?.bestAo12Ms ? calcAverage(results, 12) : null,
      totalSolves: results.length,
      todaySolves: results.filter((r) => new Date(r.createdAt) >= today).length,
      weekSolves: results.filter((r) => new Date(r.createdAt) >= weekStart).length,
    };
  }

  async getCubeStats(userId: string) {
    const results = await this.prisma.solveResult.findMany({
      where: { userId, finalTimeMs: { not: null } }, orderBy: { createdAt: 'desc' },
    });
    const cubes = ['333', '222', '444', '555', 'pyram', 'skewb'];
    const stats: Record<string, { pb: number | null; avg: number | null; count: number }> = {};
    for (const ct of cubes) {
      const r = results.filter(x => x.eventType === ct);
      if (r.length === 0) { stats[ct] = { pb: null, avg: null, count: 0 }; continue; }
      const times = r.map(x => x.finalTimeMs!).filter(t => t != null);
      stats[ct] = {
        pb: times.length ? Math.min(...times) : null,
        avg: times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : null,
        count: r.length,
      };
    }
    return stats;
  }

  async updateResult(id: string, data: { penalty?: string; note?: string }) {
    const result = await this.prisma.solveResult.findUnique({ where: { id } });
    if (!result) throw new Error('Not found');
    const finalTimeMs = getFinalTime(result.timeMs, data.penalty || result.penalty);
    return this.prisma.solveResult.update({ where: { id }, data: { penalty: data.penalty, note: data.note, finalTimeMs } });
  }

  async deleteResult(id: string) {
    return this.prisma.solveResult.delete({ where: { id } });
  }

  // ── Verification ──
  async upgradeVerification(id: string) {
    const result = await this.prisma.solveResult.findUnique({ where: { id } });
    if (!result) throw new Error('Not found');
    if (result.verificationLevel !== 'HEURISTIC') {
      return { error: '只能升级已通过 HEURISTIC 的成绩' };
    }
    return this.prisma.solveResult.update({
      where: { id },
      data: { verificationLevel: 'VIDEO', flagReason: null, flaggedAt: null },
    });
  }

  async getFlaggedResults() {
    return this.prisma.solveResult.findMany({
      where: { flagReason: { not: null }, verificationLevel: 'CASUAL' },
      orderBy: { flaggedAt: 'desc' },
      take: 50,
    });
  }
}
