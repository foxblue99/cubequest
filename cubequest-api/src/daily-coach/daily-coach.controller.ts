import { Controller, Get, Post, Param, Body, Request } from '@nestjs/common';
import { DailyCoachService } from '../ai/daily-coach.service';
import { GenerateMissionsDto, CompleteMissionDto } from './dto/daily-coach.dto';

@Controller('api/daily-coach')
export class DailyCoachController {
  constructor(private coach: DailyCoachService) {}

  @Get('today')
  getToday(@Request() req: any) {
    return this.coach.getToday(req.user.id);
  }

  @Post('generate')
  generate(@Request() req: any, @Body() dto: GenerateMissionsDto) {
    return this.coach.generate(req.user.id, dto.focus);
  }

  @Post(':index/complete')
  complete(@Request() req: any, @Param('index') index: string, @Body() dto: CompleteMissionDto) {
    if (!dto.done) throw new Error('done must be true');
    return this.coach.completeMission(req.user.id, parseInt(index));
  }
}
