import { Module } from '@nestjs/common';
import { DailyCoachController } from './daily-coach.controller';
import { DailyCoachService } from '../ai/daily-coach.service';
import { CoachCoreService } from '../ai/coach-core.service';
import { ProfileAnalyzer } from '../ai/profile-analyzer.service';
import { MemoryService } from '../ai/memory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [PrismaModule, GrowthModule],
  controllers: [DailyCoachController],
  providers: [DailyCoachService, CoachCoreService, ProfileAnalyzer, MemoryService],
  exports: [DailyCoachService],
})
export class DailyCoachModule {}
