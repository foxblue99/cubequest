import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoachCoreService } from './coach-core.service';
import { ProfileAnalyzer } from './profile-analyzer.service';
import { MemoryService } from './memory.service';
import { GrowthService } from '../growth/growth.service';
import { SkillEngineService } from './skill-engine.service';

@Injectable()
export class CoachReportService {
  constructor(
    private prisma: PrismaService,
    private core: CoachCoreService,
    private analyzer: ProfileAnalyzer,
    private memory: MemoryService,
    private growth: GrowthService,
    private skill: SkillEngineService,
  ) {}

  async trainingPlan(userId: string) {
    const [data, analysis] = await Promise.all([
      this.core.getUserData(userId),
      this.analyzer.analyze(userId),
    ]);
    const prompt = `根据以下信息生成本周训练计划：\n${await this.analyzer.userContext(userId)}\nPB: ${data.pb?(data.pb/1000).toFixed(2)+'s':'无'}\n均速: ${data.avg?(data.avg/1000).toFixed(2)+'s':'无'}\n请生成一个7天的训练计划，每天一个训练项目，含目标和预计收益。`;
    const plan = await this.core.ask('你是CubeQuest训练计划师。', prompt);
    return { plan };
  }

  async weeklyReport(userId: string) {
    const [data, analysis] = await Promise.all([
      this.core.getUserData(userId),
      this.analyzer.analyze(userId),
    ]);
    const weekAgo = new Date(Date.now()-7*24*60*60*1000);
    const weekSolves = await this.prisma.solveResult.count({ where: { userId, createdAt: { gte: weekAgo } } });
    const prompt = `生成本周训练报告：\n${await this.analyzer.userContext(userId)}\n本周还原: ${weekSolves}次\n弱点: ${analysis.weakPoints.join(';')}\n格式：总结+数据+建议。面向青少年，像教练一样说话。100字。`;
    const report = await this.core.ask('你是魔方私教教练，输出周报。', prompt);
    return { report };
  }

  async generateDailyBrief(userId: string) {
    const [analysis, mem, growthData] = await Promise.all([
      this.analyzer.analyze(userId),
      this.core.getUserData(userId),
      this.growth.getGrowth(userId),
    ]);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
    const prompt = `你是CubeQuest魔方远征向导。给${user?.nickname}生成一条早安简报（60字以内，带emoji）。\n等级: Lv${growthData.level}「${growthData.title}」| PB: ${analysis.pbMs?(analysis.pbMs/1000).toFixed(2)+'s':'无'} | 今日已练: ${mem.todaySolves}次\n格式: 打招呼+今天建议+一句鼓励。像游戏NPC一样说话。`;
    const brief = await this.core.ask('你是CubeQuest每日简报向导。', prompt);
    return { brief, todaySolves: mem.todaySolves, growth: growthData };
  }

  async generatePBHighlight(userId: string) {
    const analysis = await this.analyzer.analyze(userId);
    if (!analysis.pbMs) return { hasPB: false };
    const pbTime = (analysis.pbMs/1000).toFixed(2);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
    const commentary = await this.core.ask(
      '你是CubeQuest激情解说员，用一句话+emoji庆祝用户破PB。',
      `${user?.nickname}的PB是${pbTime}秒！等级Lv${analysis.level}。「${analysis.title}」。请像体育解说一样用10-20字庆祝，带emoji。`
    );
    return { hasPB: true, nickname: user?.nickname||'魔友', pbTime, level: analysis.level, title: analysis.title, commentary, shareText: `🏆 我的CubeQuest PB: ${pbTime}s！\n${commentary}\n来魔方远征挑战我！` };
  }

  async generateParentReport(parentId: string, childId?: string) {
    let targetId = childId;
    if (!targetId) {
      const parent = await this.prisma.parentProfile.findUnique({ where: { userId: parentId }, include: { children: { take: 1, orderBy: { createdAt: 'desc' } } } });
      targetId = parent?.children?.[0]?.childId;
    }
    if (!targetId) return { error: '未绑定孩子账号' };
    const [analysis, growthData] = await Promise.all([this.analyzer.analyze(targetId), this.growth.getGrowth(targetId)]);
    const user = await this.prisma.user.findUnique({ where: { id: targetId }, select: { nickname: true } });
    const weekAgo = new Date(Date.now()-7*24*60*60*1000);
    const weekSolves = await this.prisma.solveResult.count({ where: { userId: targetId, createdAt: { gte: weekAgo } } });

    const prompt = `你是CubeQuest青少年魔方成长顾问。请为${user?.nickname}的家长生成一份本周成长报告（100字以内）。\n等级Lv${growthData.level}「${growthData.title}」| PB: ${analysis.pbMs?(analysis.pbMs/1000).toFixed(2)+'s':'无'} | 本周训练${weekSolves}次\n优势: ${analysis.strengths.join('、')}\n弱点: ${analysis.weakPoints.join('、')}\n格式: 总结+进步+建议鼓励。语气温暖专业，像真正的教练。`;
    const report = await this.core.ask('你是CubeQuest家长沟通教练。', prompt);
    return { report, childName: user?.nickname, weekSolves, level: growthData.level, title: growthData.title, pb: analysis.pbMs?(analysis.pbMs/1000).toFixed(2)+'s':null };
  }

  async getAbilityScore(userId: string) {
    // Force compute skill snapshot first
    await this.skill.computeAndSave(userId);
    const snapshot = await this.skill.getLatest(userId);
    const score = snapshot ? {
      cross: snapshot.cross, f2l: snapshot.f2l, oll: snapshot.oll, pll: snapshot.pll,
      speed: snapshot.speed, consistency: snapshot.consistency, lookahead: snapshot.growth,
    } : null;
    return { score, growth: await this.growth.getGrowth(userId) };
  }

  // ── Analytics ──
  async diagnose(userId: string) {
    const data = await this.core.getUserData(userId);
    const analysis = await this.analyzer.analyze(userId);
    const prompt = `根据数据分析瓶颈：\nPB: ${data.pb?(data.pb/1000).toFixed(2)+'s':'无'}\n均速: ${data.avg?(data.avg/1000).toFixed(2)+'s':'无'}\n总还原: ${data.totalSolves}次\n弱点: ${analysis.weakPoints.join(';')}\n优势: ${analysis.strengths.join(';')}\n等级: Lv${analysis.level}「${analysis.title}」\n请给出3个具体的、可执行的改进建议。每条20字以内。`;
    const diagnosis = await this.core.ask('你是CubeQuest魔方技术分析教练，基于数据给建议。', prompt);
    await this.memory.upsert(userId, 'diagnosis', diagnosis.slice(0, 500), 1);
    return { diagnosis, data };
  }

  // ── Plan ──
  async dailyTasks(userId: string) {
    const [data, profile, growthData] = await Promise.all([
      this.core.getUserData(userId),
      this.analyzer.userContext(userId),
      this.growth.getGrowth(userId),
    ]);
    const prompt = `根据学员信息生成今日3-5个训练任务：\n${profile}\n今日已完成: ${data.todaySolves}次还原\n等级: Lv${growthData.level} "${growthData.title}"\n\n格式（每行一条）：\n☐ 任务名 (预计耗时) +XP奖励\n要求：可执行、量化、匹配等级。`;
    const tasks = await this.core.ask('你是CubeQuest每日训练规划师。', prompt);
    return { tasks, xpReward: 80, growth: growthData };
  }
}
