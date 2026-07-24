import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { CoursesModule } from './courses/courses.module';
import { FormulasModule } from './formulas/formulas.module';
import { ResultsModule } from './results/results.module';
import { TasksModule } from './tasks/tasks.module';
import { AchievementsModule } from './achievements/achievements.module';
import { EventsModule } from './events/events.module';
import { ParentModule } from './parent/parent.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { DailyCoachModule } from './daily-coach/daily-coach.module';
import { ActivitiesModule } from './activities/activities.module';
import { TribeModule } from './tribe/tribe.module';
import { UploadModule } from './upload/upload.module';
import { GrowthModule } from './growth/growth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule, AuthModule, CoursesModule, FormulasModule,
    ResultsModule, TasksModule, AchievementsModule, EventsModule,
    ParentModule, AdminModule, AiModule,
    DailyCoachModule, ActivitiesModule, TribeModule,
    UploadModule, GrowthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
