import { Module } from '@nestjs/common';
import { TribeController } from './tribe.controller';
import { TribeService } from './tribe.service';
import { TribeWarService } from './tribe-war.service';
import { TribeWarCron } from './tribe-war.cron';
import { PrismaModule } from '../prisma/prisma.module';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [PrismaModule, ResultsModule],
  controllers: [TribeController],
  providers: [TribeService, TribeWarService, TribeWarCron],
})
export class TribeModule {}
