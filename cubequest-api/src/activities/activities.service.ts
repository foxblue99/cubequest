import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../upload/storage.service';

interface CreateActivityDto {
  title: string; description?: string; posterUrl?: string;
  startAt: string; endAt: string;
  scramble?: string; requiresVideo?: boolean; reviewBufferDays?: number;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  async create(dto: CreateActivityDto, createdBy: string) {
    return this.prisma.activity.create({
      data: {
        title: dto.title, description: dto.description, posterUrl: dto.posterUrl ?? null,
        startAt: new Date(dto.startAt), endAt: new Date(dto.endAt),
        scramble: dto.scramble, requiresVideo: dto.requiresVideo ?? true,
        reviewBufferDays: dto.reviewBufferDays ?? 3, createdBy,
      },
    });
  }

  async list(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.activity.findMany({ where, orderBy: { startAt: 'desc' } });
  }

  async getById(id: string) {
    return this.prisma.activity.findUnique({ where: { id } });
  }

  // Fix 7: push videoLog.status=APPROVED to DB where clause
  async getLeaderboard(activityId: string) {
    return this.prisma.solveResult.findMany({
      where: {
        activityId,
        verificationLevel: 'VIDEO',
        finalTimeMs: { not: null },
        videoLog: { status: 'APPROVED' },
      },
      include: { user: { select: { id: true, nickname: true } } },
      orderBy: { finalTimeMs: 'asc' },
      take: 50,
    });
  }

  async submitResult(userId: string, activityId: string, data: { timeMs: number; scramble: string; videoUrl?: string }) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new Error('活动不存在');
    const now = new Date();
    if (now < activity.startAt || now > activity.endAt) throw new Error('不在活动时间窗口内');

    if (activity.requiresVideo && !data.videoUrl) {
      throw new Error('该活动需要提交视频验证');
    }

    const result = await this.prisma.solveResult.create({
      data: {
        userId, activityId, eventType: '333', scramble: data.scramble,
        timeMs: data.timeMs, finalTimeMs: data.timeMs, penalty: 'NONE',
        verificationLevel: 'CASUAL',
      },
    });

    if (data.videoUrl) {
      await this.prisma.videoVerificationLog.create({
        data: { solveResultId: result.id, userId, activityId, videoUrl: data.videoUrl, status: 'PENDING' },
      });
    }

    // Fix 8: over-5 submissions hint
    const existingCount = await this.prisma.solveResult.count({ where: { activityId, userId } });
    return {
      ...result,
      note: existingCount > 5 ? '本次成绩仅作记录，前5次成绩已用于排名评选' : null,
    };
  }

  async submitVideo(userId: string, solveResultId: string, videoUrl: string) {
    const result = await this.prisma.solveResult.findUnique({ where: { id: solveResultId } });
    if (!result || result.userId !== userId) throw new Error('成绩不存在或不属于你');
    await this.prisma.videoVerificationLog.create({
      data: { solveResultId, userId, videoUrl, status: 'PENDING' },
    });
    return { status: 'PENDING' };
  }

  async getPendingVideos(activityId?: string) {
    const where: any = { status: 'PENDING' };
    if (activityId) where.activityId = activityId;
    return this.prisma.videoVerificationLog.findMany({ where, include: { user: { select: { nickname: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async reviewVideo(logId: string, reviewerId: string, approved: boolean, reason?: string) {
    const log = await this.prisma.videoVerificationLog.findUnique({ where: { id: logId } });
    if (!log) throw new Error('验证记录不存在');

    const update: any = { status: approved ? 'APPROVED' : 'REJECTED', reviewedBy: reviewerId, reviewedAt: new Date() };
    if (reason) update.reviewNote = reason;

    await this.prisma.videoVerificationLog.update({ where: { id: logId }, data: update });

    if (approved) {
      await this.prisma.solveResult.update({ where: { id: log.solveResultId }, data: { verificationLevel: 'VIDEO' } });
    } else {
      // Fix 2: real file deletion
      await this.storage.deleteFile(log.videoUrl);
      await this.prisma.videoVerificationLog.update({ where: { id: logId }, data: { deletedAt: new Date() } });
    }

    return { status: update.status };
  }
}
