import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileAnalyzer } from './profile-analyzer.service';
import { MemoryService } from './memory.service';
import { GrowthService } from '../growth/growth.service';

@Injectable()
export class CoachProfileService {
  constructor(
    private prisma: PrismaService,
    private analyzer: ProfileAnalyzer,
    private memory: MemoryService,
    private growth: GrowthService,
  ) {}

  async getProfile(userId: string) {
    const analysis = await this.analyzer.analyze(userId);
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    return { analysis, profile };
  }

  async updateProfile(data: { userId: string; age?: number; experience?: string; goal?: string; mainCube?: string; trainFreq?: string; bio?: string }) {
    const updated = await this.prisma.userProfile.upsert({
      where: { userId: data.userId },
      update: { age: data.age, experience: data.experience, goal: data.goal, mainCube: data.mainCube, trainFreq: data.trainFreq, bio: data.bio },
      create: { userId: data.userId, age: data.age, experience: data.experience, goal: data.goal, mainCube: data.mainCube, trainFreq: data.trainFreq, bio: data.bio },
    });
    if (data.goal) await this.memory.upsert(data.userId, 'goal', data.goal, 2);
    if (data.experience) await this.memory.upsert(data.userId, 'experience', data.experience, 1);
    await this.prisma.eventTracking.create({ data: { userId: data.userId, event: 'PROFILE_UPDATE', metadata: JSON.stringify(data) } });
    return { profile: updated };
  }

  async getGrowth(userId: string) { return this.growth.getGrowth(userId); }

  async setPersona(userId: string, persona: string) {
    await this.prisma.userProfile.upsert({ where: { userId }, update: { bio: persona }, create: { userId, bio: persona } });
    await this.memory.upsert(userId, 'persona', persona, 2);
    return { persona };
  }

  async getCoachPreference(userId: string) {
    const pref = await this.prisma.userCoachPreference.findUnique({ where: { userId } });
    return { coachType: pref?.coachType || 'SUPPORTIVE' };
  }

  async setCoachPreference(userId: string, coachType: string) {
    await this.prisma.userCoachPreference.upsert({
      where: { userId },
      update: { coachType },
      create: { userId, coachType },
    });
    return { coachType };
  }

  async getNotifications(userId: string) {
    const [analysis, growthData, events] = await Promise.all([
      this.analyzer.analyze(userId),
      this.growth.getGrowth(userId),
      this.prisma.eventTracking.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
    const notifications: any[] = [];

    // XP milestones
    if (growthData.level >= 5 && growthData.level % 5 === 0) {
      notifications.push({ icon: '🎉', text: `达到 Lv${growthData.level} "${growthData.title}"！` });
    }
    if (analysis.pbMs && analysis.pbMs <= 30000) {
      notifications.push({ icon: '🏆', text: `PB ${(analysis.pbMs/1000).toFixed(2)}s — 已进入 Sub-30` });
    }
    if (analysis.strengths.length > 0) {
      notifications.push({ icon: '💪', text: `优势: ${analysis.strengths[0]}` });
    }
    if (analysis.weakPoints.length > 0 && analysis.weakPoints[0] !== '暂无分段数据') {
      notifications.push({ icon: '🎯', text: `建议提升: ${analysis.weakPoints[0]}` });
    }
    // Level-up events
    const levelUps = events.filter(e=>e.event==='LEVEL_UP');
    if (levelUps.length > 0 && levelUps[0].metadata) {
      const meta = JSON.parse(levelUps[0].metadata);
      notifications.push({ icon: '⬆️', text: `升级到 Lv${meta.to} "${meta.title}"` });
    }

    const data = await this.analyzer.analyze(userId);
    const stats = data.pbMs ? { pb: data.pbMs, avg: data.avgMs, totalSolves: data.totalSolves } : null;

    return { notifications: notifications.slice(0, 5), stats };
  }
}
