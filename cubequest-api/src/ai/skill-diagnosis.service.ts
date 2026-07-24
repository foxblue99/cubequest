import { Injectable } from '@nestjs/common';
import { CoachCoreService } from './coach-core.service';
import type { SkillResult } from './skill-engine.service';

const STAGE_INTROS: Record<string, string> = {
  FOUNDATION: '你正处在魔方之旅的起点。打好基础，坚持完成 5 次还原，就能解锁完整的能力图。',
  GROWTH: '你正处在高速成长期。现在练得越多，进步越快！',
  REFINEMENT: '你已经掌握了基础，现在需要打磨细节。专注弱项突破。',
  MASTERY: '你的实力已经很强了！精益求精，追求更稳定的发挥。',
  ELITE: '顶级水平！探索更深的魔方世界，分享你的经验给更多魔友吧。',
};

const SKILL_NAMES: Record<string, string> = {
  speed: '速度', cross: 'Cross', f2l: 'F2L', oll: 'OLL',
  pll: 'PLL', consistency: '稳定性', frequency: '训练量', growth: '成长',
};

const SKILL_ADVICE: Record<string, { focus: string; drills: string[] }> = {
  speed: { focus: '整体还原速度', drills: ['每天 10 次计时还原', '尝试减少观察时间', '练习流畅转动'] },
  cross: { focus: 'Cross 十字预算', drills: ['每天 15 次 Cross 单独练习', '计时 15 秒内完成 Cross', '尝试双色 Cross 预测'] },
  f2l: { focus: 'F2L 连贯性', drills: ['每天 10 次 F2L 慢拧练习', '减少 F2L 停顿', '学习 Advanced F2L 公式'] },
  oll: { focus: 'OLL 公式扩展', drills: ['每天学习 1-2 个新 OLL 公式', '练习已学的 OLL 执行速度', '减少 OLL 观察时间'] },
  pll: { focus: 'PLL 公式熟练', drills: ['每天练习 PLL 连做', '提升 PLL 执行速度', '学习 PLL 双向手法'] },
  consistency: { focus: '稳定性训练', drills: ['进行 ao12 计时练习', '关注最差成绩的差距', '保持匀速还原'] },
  frequency: { focus: '训练频率', drills: ['坚持每天至少 5 次还原', '设定每周训练目标', '养成每日训练习惯'] },
  growth: { focus: '持续进步', drills: ['回顾近期成绩趋势', '调整训练重点', '设定阶段性目标'] },
};

@Injectable()
export class SkillDiagnosisService {
  constructor(private core: CoachCoreService) {}

  /** Rule-based diagnosis (70% rules) */
  diagnose(skill: SkillResult) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (skill.strongestValue >= 70) {
      strengths.push(`${SKILL_NAMES[skill.strongestSkill]}非常扎实`);
    }
    if (skill.consistency >= 70) strengths.push('还原稳定性表现良好');
    if (skill.frequency >= 70) strengths.push('训练频率保持不错');
    if (skill.growth >= 70) strengths.push('近期进步趋势明显');
    if (skill.f2l >= 65) strengths.push('F2L 是你的优势阶段');

    if (skill.weakestValue < 40) {
      weaknesses.push(`${SKILL_NAMES[skill.weakestSkill]}需要重点加强`);
    }
    if (skill.speed < 35) weaknesses.push('整体速度还有较大提升空间');
    if (skill.consistency < 40) weaknesses.push('成绩波动较大，需要稳定训练');
    if (skill.cross < 35 && skill.weakestSkill !== 'cross') weaknesses.push('Cross 阶段需要提速');

    const summary = weaknesses.length > 0
      ? `你需要重点突破${SKILL_NAMES[skill.weakestSkill]}`
      : `${SKILL_NAMES[skill.strongestSkill]}是你的优势项目，继续保持！`;

    return {
      summary,
      stageSummary: STAGE_INTROS[skill.stage] || '',
      strengths: strengths.length ? strengths : ['各项能力均衡发展中'],
      weaknesses: weaknesses.length ? weaknesses : ['暂无明显弱项'],
    };
  }

  /** AI-enhanced advice (30% AI polishing) */
  async generateAdvice(skill: SkillResult) {
    // First: rule-based advice
    const baseAdvice = SKILL_ADVICE[skill.weakestSkill] || SKILL_ADVICE['speed'];
    const drills = baseAdvice.drills.slice(0, 3);

    // Milestones
    let milestone: string;
    if (skill.pbMs && skill.pbMs > 30000) milestone = 'Sub-30';
    else if (skill.pbMs && skill.pbMs > 20000) milestone = 'Sub-20';
    else if (skill.pbMs && skill.pbMs > 15000) milestone = 'Sub-15';
    else if (skill.pbMs && skill.pbMs > 10000) milestone = 'Sub-10';
    else milestone = 'Sub-8';

    // Estimated weeks based on growth trend
    let estimatedWeeks = 4;
    if (skill.trend === 'improving') estimatedWeeks = 2;
    else if (skill.trend === 'declining') estimatedWeeks = 6;

    // AI polish (30%)
    let aiMsg = `建议专注 ${baseAdvice.focus} 训练`;
    try {
      const polish = await this.core.ask(
        '你是魔方教练。用户当前最弱项需要训练建议。用一句话（15字以内）鼓励并指明方向。不要啰嗦。',
        `最弱项: ${SKILL_NAMES[skill.weakestSkill]}, 阶段: ${skill.stage}, Growth Score: ${skill.growthScore}`
      );
      if (polish && polish.length < 50) aiMsg = polish;
    } catch {}

    return {
      focusArea: baseAdvice.focus,
      drills,
      aiMessage: aiMsg,
      nextMilestone: `下一里程碑: ${milestone}`,
      estimatedWeeks,
    };
  }
}
