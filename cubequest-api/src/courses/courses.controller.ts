import { Controller, Get, Param, Post, UseGuards, Request, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Public } from '../auth/public.decorator';

@Controller('api')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get('courses')
  findAll(@Query('category') category?: string) { return this.coursesService.findAll(category); }

  @Public()
  @Get('courses/:id')
  findOne(@Param('id') id: string) { return this.coursesService.findOne(id); }

  @Public()
  @Get('courses/:id/lessons')
  getLessons(@Param('id') id: string) { return this.coursesService.getLessons(id); }

  @Public()
  @Get('lessons/:id')
  getLesson(@Param('id') id: string) { return this.coursesService.getLesson(id); }

  @Post('lessons/:id/complete')
  completeLesson(@Request() req: any, @Param('id') id: string) { return this.coursesService.completeLesson(req.user.id, id); }

  @Get('courses/progress/me')
  getMyProgress(@Request() req: any) { return this.coursesService.getMyProgress(req.user.id); }
}
