
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ParentService {
  constructor(private prisma: PrismaService) {}

  async generateBindCode(userId: string) {
    const code = 'CQ' + crypto.randomInt(100000, 999999).toString();
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { bindCode: code },
    });
    return { bindCode: code };
  }

  async bindChild(parentUserId: string, bindCode: string) {
    const childProfile = await this.prisma.studentProfile.findFirst({
      where: { bindCode },
      include: { user: { select: { nickname: true } } },
    });

    if (!childProfile) throw new BadRequestException('无效的绑定码');

    // Check already bound
    const existing = await this.prisma.parentChild.findFirst({
      where: { parentId: parentUserId, childId: childProfile.userId },
    });
    if (existing) throw new BadRequestException('已经绑定过该孩子');

    // Create binding
    await this.prisma.parentChild.create({
      data: { parentId: parentUserId, childId: childProfile.userId },
    });

    // Clear bind code
    await this.prisma.studentProfile.update({
      where: { id: childProfile.id },
      data: { bindCode: null },
    });

    return { success: true, childNickname: childProfile.user.nickname };
  }

  async getChildren(parentUserId: string) {
    const bindings = await this.prisma.parentChild.findMany({
      where: { parentId: parentUserId },
      include: {
        parent: {
          include: {
            user: { select: { nickname: true } },
          },
        },
      },
    });

    const children: any[] = [];
    for (const b of bindings) {
      const child = await this.prisma.user.findUnique({
        where: { id: b.childId },
        include: { studentProfile: true },
      });
      if (child) children.push(child);
    }

    return children;
  }

  async getChildSummary(parentUserId: string, childId: string) {
    // Verify binding
    const binding = await this.prisma.parentChild.findFirst({
      where: { parentId: parentUserId, childId },
    });
    if (!binding) throw new BadRequestException('未绑定的孩子');

    const child = await this.prisma.user.findUnique({
      where: { id: childId },
      include: { studentProfile: true },
    });
    if (!child) throw new BadRequestException('孩子不存在');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySolves = await this.prisma.solveResult.count({
      where: { userId: childId, createdAt: { gte: today } },
    });

    const courseProgress = await this.prisma.courseProgress.count({
      where: { userId: childId },
    });

    // Verification stats
    const verificationStats = await this.prisma.solveResult.groupBy({
      by: ['verificationLevel'],
      where: { userId: childId, finalTimeMs: { not: null } },
      _count: true,
    });
    const flaggedCount = await this.prisma.solveResult.count({
      where: { userId: childId, flagReason: { not: null } },
    });

    const verifiedCount = verificationStats.find(v => v.verificationLevel === 'VIDEO')?._count || 0;
    const heuristicCount = verificationStats.find(v => v.verificationLevel === 'HEURISTIC')?._count || 0;
    const casualCount = verificationStats.find(v => v.verificationLevel === 'CASUAL')?._count || 0;

    return {
      childId, nickname: child.nickname, avatarUrl: child.avatarUrl,
      bestSingleMs: child.studentProfile?.bestSingleMs,
      bestAo5Ms: child.studentProfile?.bestAo5Ms,
      todaySolves, streakDays: child.studentProfile?.streakDays || 0,
      courseProgress,
      verification: {
        verifiedCount, heuristicCount, casualCount, flaggedCount,
        verified: verifiedCount > 0,
      },
    };
  }
}
