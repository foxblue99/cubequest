import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { InsightService } from './insight.service';
import { AdminController } from './admin.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminTribeController } from './admin-tribe.controller';
import { AdminInsightController } from './admin-insight.controller';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [ResultsModule],
  controllers: [
    AdminController, AdminContentController,
    AdminTribeController, AdminInsightController,
  ],
  providers: [AdminService, InsightService],
})
export class AdminModule {}
