import { Controller, Post, Get, Body, Request, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { CoachChatService } from './coach-chat.service';
import { CoachReportService } from './coach-report.service';
import { CoachProfileService } from './coach-profile.service';
import { TrainingTrendService } from './training-trend.service';
import { SkillEngineService } from './skill-engine.service';
import { SkillDiagnosisService } from './skill-diagnosis.service';
import { Public } from '../auth/public.decorator';
import { ChatMessageDto, SolveTimeDto, ProfileDto, PersonaDto } from './dto/coach.dto';
import { GenerateCourseDto } from './dto/generate-course.dto';

@Controller('api/ai')
export class AiController {
  constructor(
    private ai: AiService,
    private chatSvc: CoachChatService,
    private report: CoachReportService,
    private profile: CoachProfileService,
    private trend: TrainingTrendService,
    private skill: SkillEngineService,
    private diagnosis: SkillDiagnosisService,
  ) {}

  @Post('coach')
  async coach(@Request() req: any) { return this.ai.coach(req.user.id); }

  @Post('recommend-formulas')
  async recommendFormulas(@Request() req: any) { return this.ai.recommendFormulas(req.user.id); }

  @Post('generate-course')
  async generateCourse(@Body() dto: GenerateCourseDto) { return this.ai.generateCourse(dto); }

  @Post('predict')
  async predict(@Request() req: any, @Body('targetSeconds') targetSeconds?: number) { return this.ai.predict(req.user.id, targetSeconds); }

  @Post('chat')
  async chat(@Request() req: any, @Body() dto: ChatMessageDto) { return this.ai.chat({ userId: req.user.id, message: dto.message }); }

  // ── Content creation (public) ──
  @Public() @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('polish')
  async polishContent(@Body('text') text: string) { return { result: await this.ai.polishContent(text) }; }

  @Public() @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('cover-prompt')
  async coverPrompt(@Body('topic') topic: string) { return { result: await this.ai.generateCoverPrompt(topic) }; }

  @Public() @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('formula-review')
  async formulaReview(@Body('name') name: string, @Body('moves') moves: string) { return { result: await this.ai.generateFormulaReview(name, moves) }; }

  @Public() @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('commentary')
  async commentary(@Body() dto: SolveTimeDto) {
    return { result: await this.ai.generateCommentary(dto.timeMs, dto.crossMs, dto.f2lMs, dto.ollMs, dto.pllMs) };
  }

  // ── Profile ──
  @Post('profile')
  async getProfile(@Request() req: any) { return this.profile.getProfile(req.user.id); }

  @Post('profile/update')
  async updateProfile(@Request() req: any, @Body() dto: ProfileDto) {
    return this.profile.updateProfile({ ...dto, userId: req.user.id });
  }

  @Post('growth')
  async getGrowth(@Request() req: any) { return this.profile.getGrowth(req.user.id); }

  @Post('persona')
  async setPersona(@Request() req: any, @Body() dto: PersonaDto) { return this.profile.setPersona(req.user.id, dto.persona); }

  @Post('coach-preference')
  async getCoachPreference(@Request() req: any) { return this.profile.getCoachPreference(req.user.id); }

  @Post('coach-preference/set')
  async setCoachPreference(@Request() req: any, @Body('coachType') coachType: string) { return this.profile.setCoachPreference(req.user.id, coachType); }

  @Post('training-trend')
  async trainingTrend(@Request() req: any) { return this.trend.getTrend(req.user.id); }

  // ── V3.6.1 Skill Engine ──
  @Get('skill/current')
  async skillCurrent(@Request() req: any) { return this.skill.getLatest(req.user.id); }

  @Get('skill/history')
  async skillHistory(@Request() req: any, @Query('days') days: string) { return this.skill.getHistory(req.user.id, +(days||30)); }

  @Get('skill/radar')
  async skillRadar(@Request() req: any) {
    const s = await this.skill.getLatest(req.user.id);
    if (!s) return {};
    // Show all active dimensions — min 5, max 8
    const seg = Math.round((s.cross + s.f2l + s.oll + s.pll) / 4);
    const radarData: any[] = [
      { name:'速度', value:s.speed },
      { name:'分段', value:seg },
      { name:'稳定性', value:s.consistency },
      { name:'训练量', value:s.frequency },
      { name:'成长', value:s.growth },
    ];
    // Add individual segment dimensions if they have data
    if (s.cross > 0) radarData.splice(1, 0, { name:'Cross', value:s.cross });
    if (s.f2l > 0) radarData.splice(2, 0, { name:'F2L', value:s.f2l });
    if (s.oll > 0) radarData.splice(3, 0, { name:'OLL', value:s.oll });
    if (s.pll > 0) radarData.splice(4, 0, { name:'PLL', value:s.pll });
    return {
      growthScore: s.growthScore, stage: s.stage, confidence: s.confidence,
      strongestSkill: { name: s.strongestSkill, value: s.strongestValue },
      weakestSkill: { name: s.weakestSkill, value: s.weakestValue },
      radarData,
    };
  }

  @Get('skill/diagnosis')
  async skillDiagnosis(@Request() req: any) {
    const s = await this.skill.getLatest(req.user.id);
    if (!s) return {};
    return this.diagnosis.diagnose(s);
  }

  @Get('skill/advice')
  async skillAdvice(@Request() req: any) {
    const s = await this.skill.getLatest(req.user.id);
    if (!s) return {};
    return this.diagnosis.generateAdvice(s);
  }

  @Get('skill/milestone')
  async skillMilestone(@Request() req: any) {
    const s = await this.skill.getLatest(req.user.id);
    if (!s) return {};
    const stageOrder = ['FOUNDATION','GROWTH','REFINEMENT','MASTERY','ELITE'];
    const idx = stageOrder.indexOf(s.stage);
    const next = idx < 4 ? stageOrder[idx+1] : 'ELITE';
    const msMap: Record<string,string> = {
      FOUNDATION: '完成5次计时还原 → 解锁完整能力图',
      GROWTH: 'Growth Score 达到 25 → 进入精进期',
      REFINEMENT: 'Growth Score 达到 50 → 进入大师期',
      MASTERY: 'Growth Score 达到 75 → 进入精英期',
      ELITE: '突破 Sub-10 → 达到顶级水平',
    };
    return { current: s.stage, next, nextDescription: msMap[next]||'', growthScore: s.growthScore };
  }

  @Post('coach/notifications')
  async notifications(@Request() req: any) { return this.profile.getNotifications(req.user.id); }

  @Post('coach/chat')
  async coachChat(@Request() req: any, @Body() dto: ChatMessageDto) { return this.chatSvc.coachChat(req.user.id, dto.message); }

  @Post('coach/diagnose')
  async diagnose(@Request() req: any) { return this.report.diagnose(req.user.id); }

  @Post('ability-score')
  async abilityScore(@Request() req: any) { return this.report.getAbilityScore(req.user.id); }

  @Post('coach/training-plan')
  async trainingPlan(@Request() req: any) { return this.report.trainingPlan(req.user.id); }

  @Post('daily-tasks')
  async dailyTasks(@Request() req: any) { return this.report.dailyTasks(req.user.id); }

  @Post('coach/weekly-report')
  async weeklyReport(@Request() req: any) { return this.report.weeklyReport(req.user.id); }

  @Post('daily-brief')
  async dailyBrief(@Request() req: any) { return this.report.generateDailyBrief(req.user.id); }

  @Post('pb-highlight')
  async pbHighlight(@Request() req: any) { return this.report.generatePBHighlight(req.user.id); }

  @Post('parent/weekly-report')
  async parentWeeklyReport(@Request() req: any, @Body('childId') childId?: string) { return this.report.generateParentReport(req.user.id, childId); }
}
