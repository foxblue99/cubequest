import { Controller, Get } from '@nestjs/common';
import { InsightService } from './insight.service';
import { ResultsService } from '../results/results.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/admin/insight')
@Roles('ADMIN')
export class AdminInsightController {
  constructor(private insight: InsightService, private results: ResultsService) {}

  @Get('dashboard')
  getDashboard() { return this.insight.dashboard(); }

  @Get('solve-trend')
  getTrend() { return this.insight.solveTrend(); }

  @Get('anomalies')
  getAnomalies() { return this.insight.anomalies(); }

  @Get('top-solvers')
  getTopSolvers() { return this.insight.topSolvers(); }

  @Get('recommendations')
  getRecommendations() { return this.insight.getRecommendations(); }

  @Get('flagged')
  getFlagged() { return this.results.getFlaggedResults(); }
}
