import { Controller, Get, Post, Patch, Delete, Param, Body, Request, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { RankingService } from './ranking.service';
import { Roles } from '../auth/roles.decorator';
import { CreateSolveDto, UpdateSolveDto } from './dto/solve.dto';

@Controller('api/results')
export class ResultsController {
  constructor(private resultsService: ResultsService, private ranking: RankingService) {}

  /** Legacy POST — backward compatible, always CASUAL */
  @Post()
  create(@Request() req: any, @Body() dto: CreateSolveDto) {
    return this.resultsService.create(req.user.id, dto);
  }

  /** Server timing: start */
  @Post('start')
  start(@Request() req: any) {
    return this.resultsService.startSession(req.user.id);
  }

  /** Server timing: finish with verification */
  @Post('finish')
  finish(@Request() req: any, @Body() body: { sessionToken: string; scramble: string; timeMs: number; penalty: string; crossMs?: number; f2lMs?: number; ollMs?: number; pllMs?: number; note?: string }) {
    return this.resultsService.finishWithTiming(req.user.id, body);
  }

  @Get('me')
  getMyResults(@Request() req: any, @Query('limit') limit?: string) {
    return this.resultsService.getMyResults(req.user.id, limit ? +limit : 50);
  }

  @Get('stats/me')
  getMyStats(@Request() req: any) {
    return this.resultsService.getMyStats(req.user.id);
  }

  @Get('cube-stats')
  getCubeStats(@Request() req: any) {
    return this.resultsService.getCubeStats(req.user.id);
  }

  // ── Ranking Engine ──
  @Get('hero-board')
  async getHeroBoard() {
    return this.ranking.getRanking({
      scope: 'HERO_BOARD', window: { days: 30 },
      minVerificationLevel: 'HEURISTIC', method: 'AO100',
      minSampleCount: 100, eventType: '333',
    });
  }

  @Get('challenge-rankings')
  async getChallengeRankings() {
    return this.ranking.getRanking({
      scope: 'DAILY_CHALLENGE', window: { days: 1 },
      minVerificationLevel: 'CASUAL', method: 'BEST_SINGLE',
      eventType: '333', excludeFlagged: true,
    });
  }

  // ── Verification ──
  @Roles('ADMIN')
  @Post(':id/verify')
  async verifyResult(@Param('id') id: string) {
    return this.resultsService.upgradeVerification(id);
  }

  @Roles('ADMIN')
  @Get('flagged')
  async getFlagged() {
    return this.resultsService.getFlaggedResults();
  }

  @Patch(':id')
  updateResult(@Param('id') id: string, @Body() dto: UpdateSolveDto) {
    return this.resultsService.updateResult(id, dto);
  }

  @Delete(':id')
  deleteResult(@Param('id') id: string) {
    return this.resultsService.deleteResult(id);
  }
}
