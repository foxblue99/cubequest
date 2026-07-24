import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AI_URL = 'https://api.deepseek.com/v1/chat/completions';
const AI_KEY = () => process.env.AI_API_KEY || '';
const AI_TIMEOUT_MS = 15000;
const AI_MAX_RETRIES = 2;

const FALLBACKS = {
  noKey: 'AI服务未配置，请在环境变量中设置 AI_API_KEY。',
  timeout: '你的AI教练正在调整训练方案，请稍后再试。',
  serverError: '魔方远征的AI大脑暂时过载，休息片刻马上回来。',
  rateLimit: '教练正在为太多学员服务，请稍等一分钟再试。',
  generic: 'AI教练暂时无法连接，但你的训练数据已安全保存。',
  empty: 'AI教练正在思考中，请刷新页面重试。',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/** Shared base: AI API call with timeout, retry, and graceful fallback */
@Injectable()
export class CoachCoreService {
  private readonly logger = new Logger(CoachCoreService.name);
  constructor(private prisma: PrismaService) {}

  async ask(sysPrompt: string, userPrompt: string): Promise<string> {
    const key = AI_KEY();
    if (!key) return FALLBACKS.noKey;

    let lastError = '';

    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        const res = await fetch(AI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: 800, temperature: 0.7,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        const data: any = await res.json();

        // API-level errors
        if (data?.error) {
          const errMsg = data.error?.message || '';
          if (res.status === 429 || errMsg.includes('rate')) {
            this.logger.warn(` attempt=${attempt+1}`, errMsg);
            if (attempt < AI_MAX_RETRIES) { await sleep(2000 * (attempt + 1)); continue; }
            return FALLBACKS.rateLimit;
          }
          this.logger.error(` status=${res.status}`, errMsg);
          if (attempt < AI_MAX_RETRIES) { await sleep(1000 * (attempt + 1)); continue; }
          return FALLBACKS.serverError;
        }

        // Success
        const content = data?.choices?.[0]?.message?.content;
        if (content) return content;
        lastError = 'empty response';
        this.logger.warn(` attempt=${attempt+1}`);

      } catch (err: any) {
        lastError = err?.name === 'AbortError' ? 'timeout' : err?.message || String(err);
        this.logger.error(` attempt=${attempt+1}`, lastError);
      }

      if (attempt < AI_MAX_RETRIES) await sleep(1200 * (attempt + 1));
    }

    // All retries exhausted — return graceful fallback
    if (lastError === 'timeout') return FALLBACKS.timeout;
    return FALLBACKS.generic;
  }

  async getUserData(userId: string) {
    const [profile, results] = await Promise.all([
      this.prisma.studentProfile.findUnique({ where: { userId } }),
      this.prisma.solveResult.findMany({ where: { userId, finalTimeMs: { not: null } }, orderBy: { createdAt: 'desc' } }),
    ]);
    const times = results.map(r => r.finalTimeMs!);
    const pb = times.length > 0 ? Math.min(...times) : null;
    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySolves = results.filter(r => new Date(r.createdAt) >= today).length;
    const withStages = results.filter(r => r.crossMs != null);
    const stageAvgs = withStages.length > 0 ? {
      cross: Math.round(withStages.reduce((a, r) => a + (r.crossMs || 0), 0) / withStages.length),
      f2l: Math.round(withStages.reduce((a, r) => a + (r.f2lMs || 0), 0) / withStages.length),
      oll: Math.round(withStages.reduce((a, r) => a + (r.ollMs || 0), 0) / withStages.length),
      pll: Math.round(withStages.reduce((a, r) => a + (r.pllMs || 0), 0) / withStages.length),
    } : null;
    return { pb, avg, totalSolves: times.length, todaySolves, stageAvgs };
  }
}
