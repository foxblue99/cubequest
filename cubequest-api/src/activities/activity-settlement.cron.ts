import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../upload/storage.service';

/** WCA规则：前5次提交，掐头去尾取中间3次平均。≥2次DNF或不足5次→null */
function calcAo5(records: { finalTimeMs: number | null }[]): number | null {
  if (records.length < 5) return null;
  const first5 = records.slice(0, 5);
  const dnfCount = first5.filter(r => r.finalTimeMs === null).length;
  if (dnfCount >= 2) return null;
  const values = first5.map(r => r.finalTimeMs ?? Infinity);
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

@Injectable()
export class ActivitySettlementCron {
  private readonly logger = new Logger(ActivitySettlementCron.name);
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  @Cron('0 3 * * *', { timeZone: 'Asia/Shanghai' })
  async handleSettlement() {
    const now = new Date();

    // 推进活动状态：UPCOMING → ONGOING → REVIEW_BUFFER
    await this.prisma.activity.updateMany({
      where: { status: 'UPCOMING', startAt: { lte: now }, endAt: { gte: now } },
      data: { status: 'ONGOING' },
    });
    // UPCOMING that already ended → straight to REVIEW_BUFFER
    await this.prisma.activity.updateMany({
      where: { status: 'UPCOMING', endAt: { lt: now } },
      data: { status: 'REVIEW_BUFFER' },
    });
    await this.prisma.activity.updateMany({
      where: { status: 'ONGOING', endAt: { lt: now } },
      data: { status: 'REVIEW_BUFFER' },
    });

    this.logger.log('检查需要结算的活动...');
    const activities = await this.prisma.activity.findMany({ where: { status: 'REVIEW_BUFFER' } });
    for (const a of activities) {
      const deadline = new Date(a.endAt.getTime() + a.reviewBufferDays * 86400000);
      if (now >= deadline) {
        try { await this.settleActivity(a.id); }
        catch (err) { this.logger.error(`活动结算失败: ${a.id}`, err); }
      }
    }
  }

  async settleActivity(activityId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) return;

    const approved = await this.prisma.solveResult.findMany({
      where: { activityId, verificationLevel: 'VIDEO', finalTimeMs: { not: null } },
      include: { user: { select: { nickname: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const logs = await this.prisma.videoVerificationLog.findMany({
      where: { activityId, status: 'APPROVED' },
    });
    const logMap = new Map(logs.map(l => [l.solveResultId, l]));

    // 按用户分组，保持提交时间顺序
    const byUser = new Map<string, typeof approved>();
    for (const r of approved) {
      if (!byUser.has(r.userId)) byUser.set(r.userId, []);
      byUser.get(r.userId)!.push(r);
    }

    let ao5ChampId: string | null = null;
    let bestAo5 = Infinity;

    for (const [, records] of byUser) {
      const ao5 = calcAo5(records); // records already sorted by createdAt asc
      if (ao5 === null) continue;
      if (ao5 < bestAo5) {
        bestAo5 = ao5;
        const fastest = records.slice(0, 5)
          .filter(r => r.finalTimeMs !== null)
          .sort((a, b) => a.finalTimeMs! - b.finalTimeMs!)[0];
        ao5ChampId = fastest?.id ?? null;
      }
    }

    // PB champion — compare against pre-activity history
    let pbChampId: string | null = null;
    let bestImprovement = 0;
    for (const r of approved) {
      const prev = await this.prisma.solveResult.findFirst({
        where: {
          userId: r.userId, id: { not: r.id }, finalTimeMs: { not: null },
          createdAt: { lt: activity.startAt },
        },
        orderBy: { finalTimeMs: 'asc' },
      });
      if (prev && prev.finalTimeMs! > r.finalTimeMs!) {
        const imp = prev.finalTimeMs! - r.finalTimeMs!;
        if (imp > bestImprovement) { bestImprovement = imp; pbChampId = r.id; }
      }
    }

    const retainIds = new Set<string>();
    if (ao5ChampId) retainIds.add(ao5ChampId);
    if (pbChampId) retainIds.add(pbChampId);

    for (const id of retainIds) {
      const log = logMap.get(id);
      if (log) {
        const reasons: string[] = [];
        if (id === ao5ChampId) reasons.push('ACTIVITY_AO5_CHAMPION');
        if (id === pbChampId) reasons.push('ACTIVITY_PB_CHAMPION');
        await this.prisma.videoVerificationLog.update({
          where: { id: log.id },
          data: { retained: true, retentionReason: reasons.join(',') },
        });
      }
    }

    // Clean non-retained videos — real file deletion
    for (const r of approved) {
      if (retainIds.has(r.id)) continue;
      const log = logMap.get(r.id);
      if (log) {
        await this.storage.deleteFile(log.videoUrl);
        await this.prisma.videoVerificationLog.update({
          where: { id: log.id },
          data: { deletedAt: new Date() },
        });
      }
    }

    await this.prisma.activity.update({ where: { id: activityId }, data: { status: 'CLOSED' } });
    this.logger.log(`活动 ${activityId} 已结算，冠军 ${retainIds.size} 个视频`);
  }
}
