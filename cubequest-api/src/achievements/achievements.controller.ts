
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('api/achievements')
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get('me')
  getMyAchievements(@Request() req: any) {
    return this.achievementsService.getMyAchievements(req.user.id);
  }
}
