import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/admin')
@Roles('ADMIN')
export class AdminTribeController {
  constructor(private admin: AdminService) {}

  @Get('tribe-posts')
  getTribePosts() { return this.admin.getTribePosts(); }

  @Delete('tribe-posts/:id')
  deleteTribePost(@Param('id') id: string) { return this.admin.deleteTribePost(id); }

  @Post('tribe-posts/:id/pin')
  togglePin(@Param('id') id: string) { return this.admin.togglePin(id); }

  @Get('tribe-comments')
  getTribeComments() { return this.admin.getTribeComments(); }

  @Delete('tribe-comments/:id')
  deleteTribeComment(@Param('id') id: string) { return this.admin.deleteTribeComment(id); }
}
