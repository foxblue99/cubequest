import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { KnowledgeService } from './knowledge.service';
import { CoachCoreService } from './coach-core.service';
import { CoachChatService } from './coach-chat.service';
import { CoachReportService } from './coach-report.service';
import { CoachProfileService } from './coach-profile.service';
import { MemoryService } from './memory.service';
import { ProfileAnalyzer } from './profile-analyzer.service';
import { TrainingTrendService } from './training-trend.service';
import { SkillEngineService } from './skill-engine.service';
import { SkillDiagnosisService } from './skill-diagnosis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [PrismaModule, GrowthModule],
  controllers: [AiController],
  providers: [
    AiService, KnowledgeService,
    CoachCoreService, CoachChatService, CoachReportService, CoachProfileService,
    MemoryService, ProfileAnalyzer, TrainingTrendService,
    SkillEngineService, SkillDiagnosisService,
  ],
})
export class AiModule {}
