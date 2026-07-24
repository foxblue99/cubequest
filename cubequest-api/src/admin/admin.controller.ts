import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('dashboard')
  getDashboard() { return this.admin.getDashboard(); }

  @Get('categories')
  getCategories() { return this.admin.getCategories(); }

  @Post('categories')
  createCategory(@Body() data: any) { return this.admin.createCategory(data); }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: any) { return this.admin.updateCategory(id, data); }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) { return this.admin.deleteCategory(id); }

  @Get('users')
  getUsers() { return this.admin.getUsers(); }

  @Post('users')
  createUser(@Body() data: any) { return this.admin.createUser(data); }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() data: any) { return this.admin.updateUser(id, data); }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) { return this.admin.deleteUser(id); }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body('password') password: string) { return this.admin.resetPassword(id, password); }

  @Get('events')
  getEvents() { return this.admin.getEvents(); }

  @Post('events')
  createEvent(@Body() data: any) { return this.admin.createEvent(data); }

  @Patch('events/:id')
  updateEvent(@Param('id') id: string, @Body() data: any) { return this.admin.updateEvent(id, data); }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) { return this.admin.deleteEvent(id); }

  @Get('uploads')
  getUploads() { return this.admin.getUploads(); }

  @Delete('uploads/:filename')
  deleteUpload(@Param('filename') filename: string) { return this.admin.deleteUpload(filename); }
}
