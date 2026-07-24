import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from './knowledge.service';

const AI_URL = 'https://api.deepseek.com/v1/chat/completions';
const AI_KEY = process.env.AI_API_KEY || '';
const AI_TIMEOUT_MS = 15000;
const AI_MAX_RETRIES = 2;

// Fallback messages shared with CoachCoreService
const FALLBACKS = {
  noKey: '🤖 AI 服务未配置，请在 .env 中设置 AI_API_KEY',
  timeout: '你的AI教练正在调整训练方案，请稍后再试。',
  serverError: '魔方远征的AI大脑暂时过载，休息片刻马上回来。',
  rateLimit: '教练正在为太多学员服务，请稍等一分钟再试。',
  generic: 'AI教练暂时无法连接，但你的训练数据已安全保存。',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private prisma: PrismaService, private knowledge: KnowledgeService) {}

  /** Resilient AI call with timeout, retry, and graceful fallback */
  private async ask(messages: { role: string; content: string }[]): Promise<string> {
    if (!AI_KEY) return FALLBACKS.noKey;

    let lastError = '';
    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);

        const res = await fetch(AI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 2000 }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);

        const d = await res.json() as any;
        if (d?.error) {
          const msg = d.error?.message || '';
          this.logger.error(` status=${res.status}`, msg);
          if (attempt < AI_MAX_RETRIES) { await sleep(1200 * (attempt + 1)); continue; }
          return d.error?.type === 'rate_limit_exceeded' ? FALLBACKS.rateLimit : FALLBACKS.serverError;
        }
        const content = d.choices?.[0]?.message?.content;
        if (content) return content;
        this.logger.warn(' attempt=' + (attempt + 1));

      } catch (err: any) {
        lastError = err?.name === 'AbortError' ? 'timeout' : err?.message || String(err);
        this.logger.error(` attempt=${attempt + 1}`);
      }
      if (attempt < AI_MAX_RETRIES) await sleep(1200 * (attempt + 1));
    }
    return lastError === 'timeout' ? FALLBACKS.timeout : FALLBACKS.generic;
  }

  async coach(userId: string) {
    const [user, results] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.solveResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);
    if (!user) throw new Error('用户不存在');
    const times = results.filter(r => r.finalTimeMs).map(r => ({
      t: (r.finalTimeMs! / 1000).toFixed(2) + 's',
      d: r.createdAt.toISOString().split('T')[0],
    }));
    const pb = times.length ? Math.min(...results.filter(r=>r.finalTimeMs).map(r=>r.finalTimeMs!)) / 1000 : null;
    const prompt = `作为魔方教练，分析以下数据给出训练建议：\n用户：${user.nickname}，PB：${pb?.toFixed(2) + 's' || '暂无'}\n最近成绩（时间:t, 日期:d）：${JSON.stringify(times.slice(0, 30))}\n\n要求：1.分析趋势 2.指出弱项 3.给2-3条训练建议 4.定本周目标。面向青少年，带emoji。`;
    return { advice: await this.ask([{ role: 'user', content: prompt }]) };
  }

  async recommendFormulas(userId: string) {
    const [user, formulas] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.formula.findMany({ where: { published: true } }),
    ]);
    const prompt = `用户 ${user?.nickname || '新用户'} 可以使用以下公式库：\n${formulas.map(f => `${f.name} [${f.mainCategory}/${f.category} 难度${f.difficulty}] ${f.moves}`).join('\\n')}\n\n请推荐最应该优先学习的5条公式，按难度递进排序，面向青少年魔方爱好者，带emoji。`;
    return { recommendation: await this.ask([{ role: 'user', content: prompt }]) };
  }

  async generateCourse(params: { topic: string; mainCategory?: string; subCategory?: string; lessonCount?: number }) {
    const { topic, mainCategory = '三阶魔方', lessonCount = 5 } = params;
    const prompt = `设计一门魔方课程。主题："${topic}"，类型：${mainCategory}，${lessonCount}课时。\n返回JSON（不要代码块标记）：\n{"title":"...", "summary":"...", "lessons":[{"title":"...", "type":"ARTICLE|VIDEO|INTERACTIVE|QUIZ", "content":"Markdown内容", "videoUrl":"", "formulaText":"", "cubeMoves":""}]}\n面向青少年，有趣味性，专业系统。`;
    const json = await this.ask([{ role: 'user', content: prompt }]);
    try { return JSON.parse(json.replace(/```json\\n?/g,'').replace(/```/g,'').trim()); }
    catch { this.logger.warn('AI generateCourse returned invalid JSON'); return { raw: json }; }
  }

  async predict(userId: string, target = 20) {
    const results = await this.prisma.solveResult.findMany({
      where: { userId, finalTimeMs: { not: null } }, orderBy: { createdAt: 'asc' }, take: 500,
    });
    if (results.length < 10) return { prediction: '📊 数据不足，至少需要10次有效成绩。继续练习吧！' };
    const times = results.map(r => r.finalTimeMs! / 1000);
    const pb = Math.min(...times);
    const recent = times.slice(-12);
    const trend = recent.length >= 2 ? (recent[0] - recent[recent.length-1]) / recent.length : 0;
    const prompt = `用户PB:${pb.toFixed(2)}s，总练习${times.length}次，最近趋势${trend.toFixed(2)}s/次，目标${target}s。\n预测到达目标需要多久，给加速建议。面向青少年带emoji。`;
    return { prediction: await this.ask([{ role: 'user', content: prompt }]) };
  }

  async chat(body: { userId?: string; message: string }) {
    let ctx = '';
    if (body.userId) {
      const u = await this.prisma.user.findUnique({ where: { id: body.userId } });
      if (u) ctx = `用户${u.nickname}，角色${u.role}。`;
    }
    const kb = await this.knowledge.searchContext(body.message);
    return { reply: await this.ask([
      { role: 'system', content: `你是CubeQuest魔方平台AI助手"阿拉魔神丁"，面向青少年。${ctx}回答简洁有趣带emoji，自称神丁。${kb}` },
      { role: 'user', content: body.message },
    ])};
  }

  async polishContent(text: string) {
    return this.ask([{ role: 'system', content: '你是CubeQuest魔方社区内容编辑，擅长让文案更有趣、更有魔方圈内感和速度感。面向00后青少年。' }, { role: 'user', content: `请改写以下内容，让它更生动、更有梗、更有魔方圈的燃感。保持原意，控制在150字内。原内容：\\n${text}` }]);
  }

  async generateCoverPrompt(topic: string) {
    return this.ask([{ role: 'system', content: '你是CubeQuest视觉设计AI，为魔方社区帖子生成封面图提示词。' }, { role: 'user', content: `为话题"${topic}"生成一段英文AI绘图提示词（80词内），风格：赛博朋克、Z世代、魔方3D、炫酷发光。` }]);
  }

  async generateFormulaReview(formulaName: string, moves: string) {
    return this.ask([{ role: 'system', content: '你是CubeQuest魔方公式解析师，为公式生成详细的手法复盘。面向青少年。' }, { role: 'user', content: `请为公式"${formulaName}（${moves}）"生成以下内容：\n1. 🔍 公式用途\n2. ✋ 手法要点\n3. ⚡ 提速技巧\n4. ❌ 常见错误\n每条简洁，带emoji。` }]);
  }

  async generateCommentary(timeMs: number, crossMs?: number, f2lMs?: number, ollMs?: number, pllMs?: number) {
    const total = (timeMs/1000).toFixed(2);
    const segments = [crossMs ? `Cross ${(crossMs/1000).toFixed(2)}s` : '', f2lMs ? `F2L ${(f2lMs/1000).toFixed(2)}s` : '', ollMs ? `OLL ${(ollMs/1000).toFixed(2)}s` : '', pllMs ? `PLL ${(pllMs/1000).toFixed(2)}s` : ''].filter(Boolean).join(', ');
    const totalPct = timeMs > 0 && crossMs && f2lMs && ollMs && pllMs ? `占比: Cross ${Math.round(crossMs/timeMs*100)}% F2L ${Math.round(f2lMs/timeMs*100)}% OLL ${Math.round(ollMs/timeMs*100)}% PLL ${Math.round(pllMs/timeMs*100)}%` : '';
    return this.ask([{ role: 'system', content: '你是CubeQuest魔方比赛现场解说员！风格激情澎湃如体育赛事解说，带emoji，面向00后青少年。每阶段用一句话解说，最后给总评。' }, { role: 'user', content: `这是一次${total}秒的三阶速拧还原！\\n分段: ${segments || '无分段数据'}\\n${totalPct}\\n\\n请按以下结构生成解说（每条10-20字，带emoji）：\n🎬 起手式\n🔵 Cross\n🟢 F2L  \n🟡 OLL\n🔴 PLL\n🏁 总评\n用短语，不要长句。` }]);
  }
}
