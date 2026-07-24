import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SKILL_ALGORITHM_VERSION } from './constants/skill-version';

// ── Types ──
export interface SkillProfile {
  speed: number; cross: number; f2l: number; oll: number; pll: number;
  consistency: number; frequency: number; growth: number;
}

export interface SkillResult extends SkillProfile {
  growthScore: number;
  strongestSkill: string; strongestValue: number;
  weakestSkill: string; weakestValue: number;
  stage: string;
  confidence: number;
  sampleSize: number; segmentCoverage: number;
  solveSampleSize: number; segmentSampleSize: number;
  streakDays: number; totalSolves: number;
  pbMs: number | null; avgMs: number | null;
  trend: string;
}

// ── Constants ──
const MIN_ROUNDS = 1; // Show data immediately, confidence handles quality

// ── Pure Math Functions ──
function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }

/** Speed score: based on PB vs average. Higher = faster relative to own ceiling.
 *  Score formula: base 60 + (1 - pb/avg) * 40 → capped 0-100
 *  如果 pb=20s, avg=30s: 60 + (1-0.667)*40 = 73
 *  如果 pb=10s, avg=10.5s: 60 + (1-0.95)*40 = 62
 */
function speedScore(times: number[]): number {
  if (times.length < MIN_ROUNDS) return 0;
  const avg = times.reduce((a,b)=>a+b,0)/times.length;
  const best = Math.min(...times);
  if (avg === 0 || best >= avg) return 0;
  return clamp(60 + (1 - best/avg) * 40);
}

/** Segment score with outlier trimming for large datasets */
function segmentScore(values: number[]): number {
  if (values.length < MIN_ROUNDS) return 0;
  // Only trim when we have enough data (>= 8 values)
  let working = values;
  if (values.length >= 8) {
    const sorted = [...values].sort((a, b) => a - b);
    const trim = Math.floor(sorted.length * 0.2);
    working = sorted.slice(trim, sorted.length - trim);
  }
  if (working.length < 1) return 0;
  const avg = working.reduce((a,b)=>a+b,0)/working.length;
  const best = Math.min(...working);
  if (avg === 0) return 0;
  return clamp(100 - (avg / Math.max(best, 1)) * 50);
}

/** Consistency: how stable are the times. 1 - stdev/avg */
function consistencyScore(times: number[]): number {
  if (times.length < MIN_ROUNDS) return 0;
  const avg = times.reduce((a,b)=>a+b,0)/times.length;
  const variance = times.reduce((s,t)=>s+(t-avg)**2,0)/times.length;
  const stdev = Math.sqrt(variance);
  if (avg === 0) return 0;
  return clamp((1 - stdev/avg) * 100);
}

/** Growth trend: compare first half vs second half */
function growthTrend(times: number[]): number {
  if (times.length < MIN_ROUNDS * 2) return 0;
  const mid = Math.floor(times.length/2);
  const older = times.slice(mid);
  const newer = times.slice(0, mid);
  const oldAvg = older.reduce((a,b)=>a+b,0)/older.length;
  const newAvg = newer.reduce((a,b)=>a+b,0)/newer.length;
  if (oldAvg === 0) return 50;
  const diffPct = (oldAvg - newAvg) / oldAvg * 100;
  return clamp(50 + diffPct * 4); // center at 50
}

/** Frequency: normalize to 0-100. 30 solves/month = 100 */
function frequencyScore(count30d: number): number {
  return clamp(count30d / 30 * 100);
}

/** Stage: confidence-based with totalSolves floor */
function computeStage(score: number, confidence: number, totalSolves: number): string {
  if (confidence < 30 || totalSolves < 20) return 'FOUNDATION';
  if (score < 25)      return 'GROWTH';
  if (score < 50)      return 'REFINEMENT';
  if (score < 75)      return 'MASTERY';
  return 'ELITE';
}

/** Trend direction */
function trendDir(times: number[]): string {
  if (times.length < MIN_ROUNDS * 2) return 'insufficient_data';
  const mid = Math.floor(times.length/2);
  const oldAvg = times.slice(mid).reduce((a,b)=>a+b,0)/Math.max(1,times.slice(mid).length);
  const newAvg = times.slice(0, mid).reduce((a,b)=>a+b,0)/Math.max(1,mid);
  const diff = oldAvg - newAvg;
  if (diff > 2000) return 'improving';
  if (diff < -1500) return 'declining';
  return 'stable';
}

/** Confidence: solve sample 50% + segments 30% + streak 20% */
function computeConfidence(solveCount: number, segmentCoverage: number, streakDays: number): number {
  const sampleFactor = Math.min(50, Math.round(solveCount / 10 * 50));
  const segmentFactor = Math.round(segmentCoverage / 4 * 30);
  const streakFactor = Math.min(20, Math.round(streakDays / 7 * 20));
  return Math.min(100, sampleFactor + segmentFactor + streakFactor);
}

// ── Main compute function (pure) ──
export function computeSkills(
  fullTimes: number[],
  crossVals: number[], f2lVals: number[], ollVals: number[], pllVals: number[],
  fullSolveCount: number, phaseSolveCount: number,
  streakDays: number, recent30dCount: number,
): SkillResult {
  const sampleSize = fullTimes.length + phaseSolveCount;
  const segCount = crossVals.length + f2lVals.length + ollVals.length + pllVals.length;

  // 8 dimensions — each requires >= MIN_ROUNDS
  const speed = speedScore(fullTimes);
  const cross = segmentScore(crossVals);
  const f2l = segmentScore(f2lVals);
  const oll = segmentScore(ollVals);
  const pll = segmentScore(pllVals);
  const consistency = consistencyScore(fullTimes);
  const frequency = frequencyScore(recent30dCount);
  const growth = growthTrend(fullTimes);

  const profile: SkillProfile = { speed, cross, f2l, oll, pll, consistency, frequency, growth };

  // Weighted growthScore — only count dimensions with data
  let weightedSum = 0, weightedCount = 0;
  const weights = { speed:1.2, cross:1.0, f2l:1.3, oll:1.0, pll:1.0, consistency:0.8, frequency:0.7, growth:1.0 };
  for (const [k, v] of Object.entries(profile)) {
    if (v > 0) { weightedSum += v * (weights[k as keyof typeof weights] || 1); weightedCount += (weights[k as keyof typeof weights] || 1); }
  }
  const growthScore = weightedCount > 0 ? Math.round(weightedSum / weightedCount) : 0;

  // Strongest / weakest
  const skills: [string, number][] = ([
    ['speed',speed],['cross',cross],['f2l',f2l],['oll',oll],
    ['pll',pll],['consistency',consistency],['frequency',frequency],['growth',growth],
  ] as [string, number][]).filter(([,v]) => v > 0);
  if (skills.length === 0) skills.push(['speed',0],['frequency',0]);
  skills.sort((a,b) => b[1]-a[1]);
  const strongestSkill = skills[0][0], strongestValue = skills[0][1];
  const weakestSkill = skills[skills.length-1][0], weakestValue = skills[skills.length-1][1];

  const activeSegments = [cross>0,f2l>0,oll>0,pll>0].filter(Boolean).length;
  const confidence = computeConfidence(fullSolveCount, activeSegments, streakDays);
  const stage = computeStage(growthScore, confidence, fullSolveCount + phaseSolveCount);
  const trend = trendDir(fullTimes);
  const avgMs = fullTimes.length ? Math.round(fullTimes.reduce((a,b)=>a+b,0)/fullTimes.length) : null;
  const pbMs = fullTimes.length ? Math.min(...fullTimes) : null;

  return {
    ...profile, growthScore, strongestSkill, strongestValue, weakestSkill, weakestValue,
    stage, confidence, sampleSize, segmentCoverage: activeSegments,
    solveSampleSize: fullSolveCount, segmentSampleSize: segCount,
    streakDays, totalSolves: fullSolveCount + phaseSolveCount,
    pbMs, avgMs, trend,
  };
}

// ── Service wrapper ──
@Injectable()
export class SkillEngineService {
  private readonly logger = new Logger(SkillEngineService.name);

  constructor(private prisma: PrismaService) {}

  async computeAndSave(userId: string): Promise<void> {
    try {
      // All full solves (up to 500 for performance)
      const fullResults = await this.prisma.solveResult.findMany({
        where: { userId, finalTimeMs: { not: null }, eventType: { notIn: ['cross','f2l','oll','pll'] } },
        orderBy: { createdAt: 'desc' }, take: 500,
      });
      if (fullResults.length < MIN_ROUNDS) {
        this.logger.log(`User ${userId}: only ${fullResults.length} full solves (<${MIN_ROUNDS}), creating partial snapshot`);
      }

      // All phase training data (up to 200 per phase)
      const phaseResults = await this.prisma.solveResult.findMany({
        where: { userId, eventType: { in: ['cross','f2l','oll','pll'] }, finalTimeMs: { not: null } },
        orderBy: { createdAt: 'desc' }, take: 200,
      });

      // Segment values: full solves + phase training (trimmed to handle scale differences)
      const crossVals = [
        ...fullResults.map(r => r.crossMs).filter(Boolean) as number[],
        ...phaseResults.filter(p => p.eventType === 'cross').map(p => p.finalTimeMs!).filter(Boolean),
      ];
      const f2lVals = [
        ...fullResults.map(r => r.f2lMs).filter(Boolean) as number[],
        ...phaseResults.filter(p => p.eventType === 'f2l').map(p => p.finalTimeMs!).filter(Boolean),
      ];
      const ollVals = [
        ...fullResults.map(r => r.ollMs).filter(Boolean) as number[],
        ...phaseResults.filter(p => p.eventType === 'oll').map(p => p.finalTimeMs!).filter(Boolean),
      ];
      const pllVals = [
        ...fullResults.map(r => r.pllMs).filter(Boolean) as number[],
        ...phaseResults.filter(p => p.eventType === 'pll').map(p => p.finalTimeMs!).filter(Boolean),
      ];

      const fullTimes = fullResults.map(r => r.finalTimeMs!);

      // Streak
      let streak = 0;
      const today = new Date(); today.setHours(0,0,0,0);
      for (let i = 0; i < 30; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const cnt = await this.prisma.solveResult.count({ where: { userId, createdAt: { gte: d, lt: new Date(d.getTime()+86400000) } } });
        if (cnt > 0) streak++;
        else break;
      }

      // 30d count for frequency
      const d30 = new Date(Date.now() - 30 * 86400000);
      const recent30d = await this.prisma.solveResult.count({
        where: { userId, createdAt: { gte: d30 }, finalTimeMs: { not: null } },
      });

      const skill = computeSkills(
        fullTimes, crossVals, f2lVals, ollVals, pllVals,
        fullResults.length, phaseResults.length,
        streak, recent30d,
      );

      await this.prisma.skillSnapshot.create({
        data: { userId, ...skill, algorithmVersion: SKILL_ALGORITHM_VERSION },
      });

      this.logger.log(`Skill V1.1: user=${userId.slice(0,8)} GS=${skill.growthScore} stage=${skill.stage} crossRounds=${crossVals.length} f2lRounds=${f2lVals.length}`);
    } catch (err) {
      this.logger.error(`Skill engine failed for ${userId}: ${err}`, (err as Error)?.stack?.slice(0,200));
    }
  }

  async getLatest(userId: string) {
    return this.prisma.skillSnapshot.findFirst({ where: { userId }, orderBy: { date: 'desc' } });
  }

  async getHistory(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.skillSnapshot.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }
}
