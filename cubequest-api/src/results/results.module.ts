import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { RankingService } from './ranking.service';
import { SkillEngineService } from '../ai/skill-engine.service';
import { GrowthModule } from '../growth/growth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { DailyChallengeService } from '../records/daily-challenge.service';
import { RecordsController } from '../records/records.controller';

@Module({
  imports: [GrowthModule, PrismaModule, AiModule],
  controllers: [ResultsController, RecordsController],
  providers: [ResultsService, RankingService, DailyChallengeService, SkillEngineService],
  exports: [ResultsService, RankingService],
})
export class ResultsModule {}
