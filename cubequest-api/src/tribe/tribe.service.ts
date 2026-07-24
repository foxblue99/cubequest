import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../results/ranking.service';

function calcAo5(times: number[]): number {
  const s = [...times.slice(0, 5)].sort((a,b)=>a-b);
  return (s[1]+s[2]+s[3])/3;
}
function calcAo12(times: number[]): number {
  const s = [...times.slice(0, 12)].sort((a,b)=>a-b);
  return (s[1]+s[2]+s[3]+s[4]+s[5]+s[6]+s[7]+s[8]+s[9]+s[10])/10;
}

// 神位体系
const TIERS = [
  { name: '青铜魔士', icon: '🥉', minPb: 60, minContrib: 0 },
  { name: '白银魔师', icon: '🥈', minPb: 40, minContrib: 100 },
  { name: '黄金魔尊', icon: '🥇', minPb: 30, minContrib: 300 },
  { name: '铂金魔圣', icon: '💎', minPb: 20, minContrib: 1000 },
  { name: '钻石魔皇', icon: '👑', minPb: 15, minContrib: 3000 },
  { name: '传说魔神', icon: '🔮', minPb: 10, minContrib: 10000 },
];

export function calcTier(pbMs: number | null, contrib: number): typeof TIERS[0] {
  const pbSec = pbMs ? pbMs / 1000 : 999;
  // Find best tier from PB
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (pbSec <= t.minPb) tier = t;
  }
  // Check if contribution gives better tier
  for (const t of TIERS) {
    if (contrib >= t.minContrib && TIERS.indexOf(t) > TIERS.indexOf(tier)) tier = t;
  }
  return tier;
}

@Injectable()
export class TribeService {
  constructor(private prisma: PrismaService, private ranking: RankingService) {}

  async getPosts(sort = 'latest', page = 1) {
    const take = 20;
    const skip = (page - 1) * take;
    const orderBy: any = sort === 'hot' ? { flames: 'desc' } : { createdAt: 'desc' };

    const posts = await this.prisma.tribePost.findMany({
      orderBy: [{ pinned: 'desc' }, orderBy],
      take, skip,
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
        comments: { take: 3, orderBy: { createdAt: 'desc' }, include: { user: { select: { nickname: true } } } },
        _count: { select: { comments: true, flamesRel: true } },
      },
    });

    // Calc tiers for each post author
    return await Promise.all(posts.map(async p => {
      const pb = await this.prisma.solveResult.findFirst({
        where: { userId: p.userId, finalTimeMs: { not: null } },
        orderBy: { finalTimeMs: 'asc' },
      });
      const postCount = await this.prisma.tribePost.count({ where: { userId: p.userId } });
      const contrib = postCount * 10 + p.flames * 2;
      const tier = calcTier(pb?.finalTimeMs ?? null, contrib);
      return { ...p, authorTier: tier };
    }));
  }

  async createPost(userId: string, body: any) {
    const { content, imageUrls, videoUrl, resultRef } = body;
    return this.prisma.tribePost.create({
      data: {
        userId,
        content: content || '',
        imageUrls: JSON.stringify(imageUrls || []),
        videoUrl: videoUrl || null,
        resultRef: resultRef || null,
      },
      include: { user: { select: { nickname: true, avatarUrl: true } } },
    });
  }

  async deletePost(id: string, userId: string, role: string) {
    const post = await this.prisma.tribePost.findUnique({ where: { id }, select: { userId: true } });
    if (!post) throw new ForbiddenException('帖子不存在');
    if (post.userId !== userId && role !== 'ADMIN') throw new ForbiddenException('无权删除他人帖子');
    return this.prisma.tribePost.delete({ where: { id } });
  }

  async toggleFlame(postId: string, userId: string) {
    const existing = await this.prisma.tribeFlame.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await this.prisma.tribeFlame.delete({ where: { id: existing.id } });
      await this.prisma.tribePost.update({ where: { id: postId }, data: { flames: { decrement: 1 } } });
      return { flamed: false };
    }
    await this.prisma.tribeFlame.create({ data: { postId, userId } });
    await this.prisma.tribePost.update({ where: { id: postId }, data: { flames: { increment: 1 } } });
    return { flamed: true };
  }

  async getComments(postId: string) {
    return this.prisma.tribeComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { nickname: true, avatarUrl: true } } },
    });
  }

  async addComment(postId: string, userId: string, content: string) {
    return this.prisma.tribeComment.create({
      data: { postId, userId, content },
      include: { user: { select: { nickname: true, avatarUrl: true } } },
    });
  }

  async getRankings() {
    const users = await this.prisma.user.findMany({ take: 50 });
    const rankings = await Promise.all(users.map(async u => {
      const pb = await this.prisma.solveResult.findFirst({
        where: { userId: u.id, finalTimeMs: { not: null } },
        orderBy: { finalTimeMs: 'asc' },
      });
      const postCount = await this.prisma.tribePost.count({ where: { userId: u.id } });
      const totalFlames = (await this.prisma.tribePost.aggregate({ where: { userId: u.id }, _sum: { flames: true } }))._sum.flames || 0;
      const contrib = postCount * 10 + totalFlames * 2;
      const tier = calcTier(pb?.finalTimeMs ?? null, contrib);
      return {
        userId: u.id,
        nickname: u.nickname,
        pb: pb?.finalTimeMs ? (pb.finalTimeMs / 1000).toFixed(2) + 's' : '--',
        posts: postCount,
        flames: totalFlames,
        tier,
      };
    }));
    return rankings.sort((a, b) => {
      const ai = TIERS.indexOf(a.tier), bi = TIERS.indexOf(b.tier);
      if (ai !== bi) return bi - ai;
      return b.flames - a.flames;
    });
  }

  async getPost(id: string) {
    const p = await this.prisma.tribePost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
        comments: { orderBy: { createdAt: 'asc' }, include: { user: { select: { nickname: true } } } },
        _count: { select: { comments: true, flamesRel: true } },
      },
    });
    if (!p) throw new Error('帖子不存在');
    const pb = await this.prisma.solveResult.findFirst({
      where: { userId: p.userId, finalTimeMs: { not: null } },
      orderBy: { finalTimeMs: 'asc' },
    });
    const postCount = await this.prisma.tribePost.count({ where: { userId: p.userId } });
    const contrib = postCount * 10 + p.flames * 2;
    return { ...p, authorTier: calcTier(pb?.finalTimeMs ?? null, contrib) };
  }

  async getUserProfile(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, nickname: true, avatarUrl: true, createdAt: true } });
    if (!u) throw new Error('用户不存在');
    const pb = await this.prisma.solveResult.findFirst({
      where: { userId, finalTimeMs: { not: null } },
      orderBy: { finalTimeMs: 'asc' },
    });
    const allResults = await this.prisma.solveResult.findMany({
      where: { userId, finalTimeMs: { not: null } },
      orderBy: { finalTimeMs: 'asc' },
      take: 100,
    });
    const postCount = await this.prisma.tribePost.count({ where: { userId } });
    const posts = await this.prisma.tribePost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { comments: true, flamesRel: true } } },
    });
    const totalFlames = (await this.prisma.tribePost.aggregate({ where: { userId }, _sum: { flames: true } }))._sum.flames || 0;
    const contrib = postCount * 10 + totalFlames * 2;
    const tier = calcTier(pb?.finalTimeMs ?? null, contrib);

    // Calculate times array (needed for both sub and ao5/ao12)
    const times = allResults.map(r => r.finalTimeMs!).filter(t => t !== null) as number[];

    // Calculate running average (SUB) for this user
    const avgMs = times.length > 0 ? times.reduce((a,b)=>a+b,0) / times.length : null;
    const subFormatted = avgMs ? (avgMs / 1000).toFixed(2) + 's' : '--';

    // Get all users' averages for ranking
    const allUsersResults = await this.prisma.solveResult.findMany({
      where: { finalTimeMs: { not: null } },
      select: { userId: true, finalTimeMs: true },
      orderBy: { finalTimeMs: 'asc' },
      take: 5000,
    });
    // Group by userId and calc averages
    const userMap = new Map<string, number[]>();
    for (const r of allUsersResults) {
      if (!userMap.has(r.userId)) userMap.set(r.userId, []);
      userMap.get(r.userId)!.push(r.finalTimeMs!);
    }
    const userAvgs = Array.from(userMap.entries()).map(([uid, tms]) => ({
      userId: uid,
      avgMs: tms.reduce((a,b)=>a+b,0) / tms.length,
      pbMs: Math.min(...tms),
    })).sort((a,b)=>a.avgMs - b.avgMs);
    const pbRanks = [...userAvgs].sort((a,b)=>a.pbMs - b.pbMs);

    const subRank = userAvgs.findIndex(u=>u.userId===userId) + 1;
    const pbRank = pbRanks.findIndex(u=>u.userId===userId) + 1;
    const totalRanked = userAvgs.length;

    // Calculate ao5/ao12
    const ao5 = times.length >= 5 ? calcAo5(times) : null;
    const ao12 = times.length >= 12 ? calcAo12(times) : null;

    return {
      user: u,
      tier,
      pb: pb?.finalTimeMs ?? null,
      pbFormatted: pb?.finalTimeMs ? (pb.finalTimeMs / 1000).toFixed(2) + 's' : '--',
      subFormatted,
      ao5: ao5 ? (ao5 / 1000).toFixed(2) + 's' : '--',
      ao12: ao12 ? (ao12 / 1000).toFixed(2) + 's' : '--',
      totalSolves: allResults.length,
      subRank: subRank || 0,
      pbRank: pbRank || 0,
      totalRanked,
      postCount,
      totalFlames,
      contrib,
      posts,
    };
  }

  async getDailyHeroes() {
    const rankings = await this.ranking.getRanking({
      scope: 'HERO_BOARD', window: { days: 1 },
      minVerificationLevel: 'CASUAL', method: 'BEST_SINGLE',
      eventType: '333', excludeFlagged: true,
    });
    return rankings.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      nickname: r.nickname,
      timeMs: r.value,
      timeFormatted: r.timeFormatted,
    }));
  }
}
