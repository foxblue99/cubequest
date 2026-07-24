import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserProfileAnalysis {
  userId: string; nickname: string; age?: number; experience?: string; goal?: string;
  level: number; xp: number; title: string; pbMs: number | null; avgMs: number | null;
  totalSolves: number; weakPoints: string[]; strengths: string[]; suggestedNextGoal: string;
}

@Injectable()
export class ProfileAnalyzer {
  constructor(private prisma: PrismaService) {}

  async analyze(userId: string): Promise<UserProfileAnalysis> {
    const [user, profile, growth] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } }),
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.userGrowth.findUnique({ where: { userId } }),
    ]);
    const results = await this.prisma.solveResult.findMany({
      where: { userId, finalTimeMs: { not: null } }, orderBy: { createdAt: 'desc' },
    });
    const times = results.map(r => r.finalTimeMs!);
    const pbMs = times.length > 0 ? Math.min(...times) : null;
    const avgMs = times.length > 0 ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : null;
    const withStages = results.filter(r => r.crossMs != null);
    const stageAvgs = withStages.length > 0 ? {
      cross: Math.round(withStages.reduce((a,r)=>a+(r.crossMs||0),0)/withStages.length),
      f2l: Math.round(withStages.reduce((a,r)=>a+(r.f2lMs||0),0)/withStages.length),
      oll: Math.round(withStages.reduce((a,r)=>a+(r.ollMs||0),0)/withStages.length),
      pll: Math.round(withStages.reduce((a,r)=>a+(r.pllMs||0),0)/withStages.length),
    } : null;
    const weakPoints: string[] = []; const strengths: string[] = [];
    if (stageAvgs && pbMs) {
      const total = stageAvgs.cross + stageAvgs.f2l + stageAvgs.oll + stageAvgs.pll;
      if (stageAvgs.cross / total > 0.3) weakPoints.push('Cross偏慢');
      else strengths.push('Cross流畅');
      if (stageAvgs.f2l / total > 0.5) weakPoints.push('F2L是瓶颈');
      else if (stageAvgs.f2l / total < 0.35 && pbMs < 30000) strengths.push('F2L功底扎实');
    } else { weakPoints.push('暂无分段数据'); }
    if (pbMs && pbMs <= 15000) strengths.push('Sub-15高手');
    let suggestedNextGoal = '突破当前PB';
    if (!pbMs) suggestedNextGoal = '完成第一次计时还原';
    else if (pbMs > 60000) suggestedNextGoal = '冲击Sub-60';
    else if (pbMs > 30000) suggestedNextGoal = '冲击Sub-30';
    else if (pbMs > 20000) suggestedNextGoal = '冲击Sub-20';
    else if (pbMs > 15000) suggestedNextGoal = '冲击Sub-15';
    else if (pbMs > 10000) suggestedNextGoal = '冲击Sub-10';
    return { userId, nickname: user?.nickname || '魔友', age: profile?.age ?? undefined, experience: profile?.experience ?? undefined, goal: profile?.goal ?? undefined, level: growth?.level || 1, xp: growth?.xp || 0, title: growth?.title || '新手', pbMs, avgMs, totalSolves: times.length, weakPoints, strengths, suggestedNextGoal };
  }

  async userContext(userId: string): Promise<string> {
    const a = await this.analyze(userId);
    return [`学员: ${a.nickname}`, a.age ? `年龄: ${a.age}岁` : '', a.experience ? `经验: ${a.experience}` : '', a.goal ? `目标: ${a.goal}` : '', `等级: Lv${a.level} "${a.title}" (${a.xp}XP)`, a.pbMs ? `PB: ${(a.pbMs/1000).toFixed(2)}s` : '尚无PB', a.avgMs ? `均速: ${(a.avgMs/1000).toFixed(2)}s` : '', `总还原: ${a.totalSolves}次`, a.weakPoints.length ? `弱点: ${a.weakPoints.join('；')}` : '', a.strengths.length ? `优势: ${a.strengths.join('；')}` : '', `建议目标: ${a.suggestedNextGoal}`].filter(Boolean).join(' | ');
  }

  /** Update abilityScore from solve data */
  async updateAbilityScore(userId: string) {
    const results = await this.prisma.solveResult.findMany({
      where: { userId, finalTimeMs: { not: null }, crossMs: { not: null } },
      orderBy: { createdAt: 'desc' }, take: 20,
    });
    if (results.length < 5) return null;
    const avg = (arr: number[]) => Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
    const crossAvg=avg(results.map(r=>r.crossMs!)), f2lAvg=avg(results.map(r=>r.f2lMs!)), ollAvg=avg(results.map(r=>r.ollMs!)), pllAvg=avg(results.map(r=>r.pllMs!));
    const score = {
      cross: Math.min(100, Math.max(0, Math.round((5000-crossAvg)/50))),
      f2l: Math.min(100, Math.max(0, Math.round((20000-f2lAvg)/200))),
      oll: Math.min(100, Math.max(0, Math.round((5000-ollAvg)/50))),
      pll: Math.min(100, Math.max(0, Math.round((5000-pllAvg)/50))),
      lookahead: Math.min(100, Math.max(0, Math.round(100 - (f2lAvg/200)))),
    };
    await this.prisma.userGrowth.update({ where: { userId }, data: { abilityScore: JSON.stringify(score) } });
    return score;
  }
}
