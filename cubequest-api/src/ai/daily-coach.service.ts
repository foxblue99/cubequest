import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoachCoreService } from '../ai/coach-core.service';
import { ProfileAnalyzer } from '../ai/profile-analyzer.service';
import { MemoryService } from '../ai/memory.service';
import { GrowthService } from '../growth/growth.service';

const FALLBACK_MISSIONS = [
  { title: '完成10次计时还原', done: false },
  { title: '练习Cross预算5次', done: false },
  { title: '学习1条新公式', done: false },
];

function levelPhase(level: number, pbMs: number | null): string {
  if (!pbMs) return '入门阶段——需建立基础还原能力';
  if (pbMs > 60000) return '入门提速——PB>60s';
  if (pbMs > 40000) return '进阶初期——PB 40-60s';
  if (pbMs > 30000) return '进阶中期——PB 30-40s';
  if (pbMs > 20000) return '进阶后期——PB 20-30s';
  if (pbMs > 15000) return '高手入门——PB 15-20s';
  if (pbMs > 10000) return '高手进阶——PB 10-15s';
  return '顶级竞速——PB<10s';
}

const COACH_PERSONAS: Record<string, string> = {
  COMPETITIVE: '你是竞技型教练——专业、目标导向、强调突破。语言直接有力，用"挑战"、"极限"、"突破"这类词。',
  SUPPORTIVE: '你是陪伴型教练——鼓励、温暖、强调坚持。用"慢慢来"、"你已经很棒了"、"每天都在进步"这类词。',
  MENTOR: '你是导师型教练——教学、分析、注重方法。用"问题的根源是"、"建议这样调整"、"理解原理更重要"这类词。',
};

@Injectable()
export class DailyCoachService {
  private readonly logger = new Logger(DailyCoachService.name);

  constructor(
    private prisma: PrismaService,
    private core: CoachCoreService,
    private analyzer: ProfileAnalyzer,
    private memory: MemoryService,
    private growth: GrowthService,
  ) {}

  /** V3.5.1: Get today (auto-generate if missing) */
  async getToday(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const mission = await this.prisma.dailyMission.findUnique({ where: { userId_date: { userId, date: today } } });
    
    // Check days since last training
    const lastSolve = await this.prisma.solveResult.findFirst({
      where: { userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true },
    });
    let remindMsg = '';
    if (lastSolve) {
      const daysSince = Math.floor((Date.now() - new Date(lastSolve.createdAt).getTime()) / 86400000);
      if (daysSince >= 3) remindMsg = `你已经${daysSince}天没摸魔方了，快来活动一下手指 👋`;
      else if (daysSince >= 1) remindMsg = `昨天没练吧？今天补上！💪`;
    } else {
      remindMsg = '第一次计时还没完成？点击开始训练解锁你的能力图 🚀';
    }

    if (!mission) {
      // Auto-generate if not yet created
      return this.generate(userId);
    }
    return {
      missions: JSON.parse(mission.missions),
      aiReason: mission.aiReason,
      xpReward: mission.xpReward,
      completed: mission.completed,
      coachMessage: mission.coachMessage,
      completionFeedback: mission.completionFeedback,
      remindMsg,
    };
  }

  async generate(userId: string, focus?: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.prisma.dailyMission.findUnique({ where: { userId_date: { userId, date: today } } });
    if (existing) return this.getToday(userId);

    // Gather profile
    const analysis = await this.analyzer.analyze(userId);
    const profile = await this.analyzer.userContext(userId);
    const { pbMs, level, title, weakPoints, strengths, age, experience, goal, suggestedNextGoal, avgMs, totalSolves } = analysis;
    const phase = levelPhase(level, pbMs);

    // Load coach persona
    const pref = await this.prisma.userCoachPreference.findUnique({ where: { userId } });
    let coachType = pref?.coachType || 'SUPPORTIVE';
    // Also check AIMemory for legacy persona preference
    if (!pref) {
      const mem = await this.memory.recall(userId, 'persona', 1);
      if (mem?.[0]?.content) {
        const map: Record<string,string> = { gentle:'SUPPORTIVE', strict:'COMPETITIVE', bro:'MENTOR' };
        coachType = map[mem[0].content] || 'SUPPORTIVE';
      }
    }
    const personaPrompt = COACH_PERSONAS[coachType] || COACH_PERSONAS.SUPPORTIVE;

    const focusHint = focus ? `\n今日重点关注: ${focus}` : '';

    const sysPrompt = `${personaPrompt}

你是一名长期陪伴青少年的魔方教练，每天给同一位学生定制训练计划。

学生档案：
- 昵称：${analysis.nickname}
- 年龄：${age ? age + '岁' : '未知'}
- 等级：Lv${level}「${title}」
- 目标：${goal || '未设定'}
- PB：${pbMs ? (pbMs/1000).toFixed(2) + 's' : '暂无'}
- 弱点：${weakPoints.join('；') || '无数据'}
- 优势：${strengths.join('；') || '无数据'}
- 当前阶段：${phase}
- 建议目标：${suggestedNextGoal}
${focusHint}

请输出纯JSON（不要代码块标记）：
{
  "missions": [{"title":"任务1","done":false},{"title":"任务2","done":false},{"title":"任务3","done":false}],
  "coachMessage": "25字以内的教练每日寄语，体现长期陪伴感，带上学生名字",
  "aiReason": "20字以内说明为什么定制这些任务"
}`;

    const userPrompt = `请为《${analysis.nickname}》（Lv${level}${title}）生成适合${phase}的今日训练。`;

    const raw = await this.core.ask(sysPrompt, userPrompt);

    // Parse
    let missions: any[] = FALLBACK_MISSIONS;
    let aiReason = '';
    let coachMessage = '';

    try {
      const cleaned = raw.replace(/```json\n?/g,'').replace(/```/g,'').trim();
      const parsed = JSON.parse(cleaned);
      missions = parsed.missions || parsed;
      aiReason = parsed.aiReason || '';
      coachMessage = parsed.coachMessage || '';
      if (!Array.isArray(missions)) {
        missions = FALLBACK_MISSIONS;
      } else {
        missions = missions.map((m:any) => ({ title: m.title || String(m), done: m.done || false }));
      }
    } catch {
      this.logger.warn('AI parse failed, using fallback');
      aiReason = `为Lv${level}「${title}」定制`;
      coachMessage = `${analysis.nickname}，今天继续加油！`;
    }

    if (!coachMessage) {
      coachMessage = `${analysis.nickname}，教练相信你今天一定会有所突破 💪`;
    }

    const xpReward = 60 + Math.min(level * 10, 100);

    // Save (now with coachMessage)
    await this.prisma.dailyMission.upsert({
      where: { userId_date: { userId, date: today } },
      update: { missions: JSON.stringify(missions), aiReason, xpReward, coachMessage },
      create: { userId, date: today, missions: JSON.stringify(missions), aiReason, xpReward, coachMessage },
    });

    await this.prisma.eventTracking.create({
      data: { userId, event: 'DAILY_COACH_GENERATED', metadata: JSON.stringify({ xpReward, coachType }) },
    }).catch(() => {});

    await this.memory.upsert(userId, 'last_coach', coachMessage, 1).catch(() => {});

    return { missions, aiReason, xpReward, completed: false, coachMessage };
  }

  async completeMission(userId: string, missionIndex: number) {
    const today = new Date().toISOString().split('T')[0];
    const mission = await this.prisma.dailyMission.findUnique({ where: { userId_date: { userId, date: today } } });
    if (!mission) throw new Error('今日任务未生成');

    const missions: { title: string; done: boolean }[] = JSON.parse(mission.missions);
    if (missionIndex < 0 || missionIndex >= missions.length) throw new Error('无效任务索引');

    missions[missionIndex].done = true;
    const allDone = missions.every(m => m.done);

    let completionFeedback = mission.completionFeedback;

    // When all done, generate AI feedback
    if (allDone && !completionFeedback) {
      try {
        const analysis = await this.analyzer.analyze(userId);
        const fb = await this.core.ask(
          `你是一名魔方教练。学生${analysis.nickname}刚刚完成了今天的全部训练任务：${missions.map(m=>m.title).join('、')}。请用一句话（20字内）给予鼓励和成长反馈。`,
          `请给${analysis.nickname}一段完成训练的反馈。`
        );
        completionFeedback = fb.slice(0, 60);
      } catch {
        completionFeedback = '🎉 太棒了！今天任务全部完成，你在变强的路上又前进了一步。';
      }
    }

    await this.prisma.dailyMission.update({
      where: { userId_date: { userId, date: today } },
      data: { missions: JSON.stringify(missions), completed: allDone, completionFeedback },
    });

    try { await this.growth.onSolve(userId, false); } catch {}
    await this.prisma.eventTracking.create({
      data: { userId, event: 'DAILY_COACH_COMPLETED', metadata: JSON.stringify({ index: missionIndex, allDone }) },
    }).catch(() => {});

    // V3.5.2: Record achievement & skill memory
    if (allDone) {
      this.memory.upsert(userId, 'daily_achievement', `完成${new Date().toISOString().split('T')[0]}全部训练任务`, 2, 'ACHIEVEMENT').catch(()=>{});
      this.memory.upsert(userId, 'skill_progress', missions.map(m=>m.title).join('、'), 1, 'SKILL').catch(()=>{});
    }

    return { missions, aiReason: mission.aiReason, xpReward: allDone ? mission.xpReward : 20, completed: allDone, coachMessage: mission.coachMessage, completionFeedback };
  }
}
