import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { DailyChallengeService } from './daily-challenge.service';
import { Public } from '../auth/public.decorator';

@Controller('api')
export class RecordsController {
  constructor(private daily: DailyChallengeService) {}

  @Public()
  @Get('daily-challenge')
  getDailyChallenge() { return this.daily.getToday(); }

  @Post('daily-challenge/submit')
  submitDaily(@Request() req: any, @Body() body: { timeMs: number; penalty?: string }) {
    return this.daily.submit(req.user.id, body.timeMs, body.penalty);
  }
}
