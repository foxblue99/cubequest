import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/admin')
@Roles('ADMIN')
export class AdminContentController {
  constructor(private admin: AdminService) {}

  @Get('courses')
  getCourses() { return this.admin.getCourses(); }

  @Post('courses')
  createCourse(@Body() data: any) { return this.admin.createCourse(data); }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() data: any) { return this.admin.updateCourse(id, data); }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) { return this.admin.deleteCourse(id); }

  @Get('lessons')
  getLessons() { return this.admin.getLessons(); }

  @Post('lessons')
  createLesson(@Body() data: any) { return this.admin.createLesson(data); }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() data: any) { return this.admin.updateLesson(id, data); }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) { return this.admin.deleteLesson(id); }

  @Get('formulas')
  getFormulas() { return this.admin.getFormulas(); }

  @Post('formulas')
  createFormula(@Body() data: any) { return this.admin.createFormula(data); }

  @Patch('formulas/:id')
  updateFormula(@Param('id') id: string, @Body() data: any) { return this.admin.updateFormula(id, data); }

  @Delete('formulas/:id')
  deleteFormula(@Param('id') id: string) { return this.admin.deleteFormula(id); }
}
