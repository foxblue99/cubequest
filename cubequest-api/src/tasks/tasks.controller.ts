
import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('api/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('today')
  getTodayTasks(@Request() req: any) {
    return this.tasksService.getTodayTasks(req.user.id);
  }

  @Post(':id/progress')
  updateProgress(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.updateProgress(req.user.id, id);
  }
}
