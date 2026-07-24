import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivitySettlementCron } from './activity-settlement.cron';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [PrismaModule, UploadModule, ResultsModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitySettlementCron],
})
export class ActivitiesModule {}
