import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ResultsService } from '../results/results.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@Controller('api/activities')
export class ActivitiesController {
  constructor(private svc: ActivitiesService, private results: ResultsService, private prisma: PrismaService) {}

  @Roles('ADMIN') @Post()
  async create(@Request() req: any, @Body() dto: any) { return this.svc.create(dto, req.user.id); }

  @Public() @Get()
  async list(@Query('status') status?: string) { return this.svc.list(status); }

  @Public() @Get(':id')
  async getById(@Param('id') id: string) { return this.svc.getById(id); }

  @Public() @Get(':id/leaderboard')
  async leaderboard(@Param('id') id: string) { return this.svc.getLeaderboard(id); }

  // Fix 3: route through server-anchored finishWithTiming
  @Post(':id/submit')
  async submit(@Request() req: any, @Param('id') id: string, @Body() dto: { sessionToken: string; timeMs: number; scramble: string; penalty?: string; videoUrl?: string; crossMs?: number; f2lMs?: number; ollMs?: number; pllMs?: number }) {
    const result = await this.results.finishWithTiming(req.user.id, {
      sessionToken: dto.sessionToken, scramble: dto.scramble,
      timeMs: dto.timeMs, penalty: dto.penalty || 'NONE',
      crossMs: dto.crossMs, f2lMs: dto.f2lMs, ollMs: dto.ollMs, pllMs: dto.pllMs,
      activityId: id,
    });
    // Handle video upload if provided
    if (dto.videoUrl && result?.result?.id) {
      await this.svc.submitVideo(req.user.id, result.result.id, dto.videoUrl);
    }
    const existingCount = await this.prisma.solveResult.count({
      where: { activityId: id, userId: req.user.id },
    });
    return {
      ...result,
      note: existingCount > 5 ? '本次成绩仅作记录，前5次成绩已用于排名评选' : null,
    };
  }

  @Post(':id/video-verify')
  async submitVideo(@Request() req: any, @Param('id') id: string, @Body() dto: { videoUrl: string }) { return this.svc.submitVideo(req.user.id, id, dto.videoUrl); }

  @Roles('ADMIN') @Get('video-verification/pending')
  async pendingVideos(@Query('activityId') activityId?: string) { return this.svc.getPendingVideos(activityId); }

  @Roles('ADMIN') @Post('video-verification/:logId/review')
  async reviewVideo(@Param('logId') logId: string, @Request() req: any, @Body() dto: { approved: boolean; reason?: string }) {
    return this.svc.reviewVideo(logId, req.user.id, dto.approved, dto.reason);
  }
}
