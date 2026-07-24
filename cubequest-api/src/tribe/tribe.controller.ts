import { Controller, Get, Post, Delete, Param, Body, Query, Req, Request } from '@nestjs/common';
import { TribeService } from './tribe.service';
import { TribeWarService } from './tribe-war.service';
import { Public } from '../auth/public.decorator';

@Controller('api/tribe')
export class TribeController {
  constructor(private tribe: TribeService, private warSvc: TribeWarService) {}

  @Public() @Get('posts/:id')
  async getPost(@Param('id') id: string) { return this.tribe.getPost(id); }

  @Public() @Get('posts')
  async getPosts(@Query('sort') sort: string, @Query('page') page: string) { return this.tribe.getPosts(sort, +(page||1)); }

  @Post('posts')
  async createPost(@Body() body: any, @Req() req: any) { return this.tribe.createPost(req.user.id, body); }

  @Delete('posts/:id')
  async deletePost(@Req() req: any, @Param('id') id: string) { return this.tribe.deletePost(id, req.user.id, req.user.role); }

  @Post('posts/:id/flame')
  async toggleFlame(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.tribe.toggleFlame(id, req.user.id); }

  @Public() @Get('posts/:id/comments')
  async getComments(@Param('id') id: string) { return this.tribe.getComments(id); }

  @Post('posts/:id/comments')
  async addComment(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.tribe.addComment(id, req.user.id, body.content); }

  @Public() @Get('rankings')
  async getRankings() { return this.tribe.getRankings(); }

  @Public() @Get('users/:id')
  async getUserProfile(@Param('id') id: string) { return this.tribe.getUserProfile(id); }

  @Public() @Get('daily-heroes')
  async getDailyHeroes() { return this.tribe.getDailyHeroes(); }

  // ── Tribe War ──
  @Public() @Get('war/standings')
  async warStandings() { return this.warSvc.getStandings(); }

  @Post('war/join')
  async warJoin(@Request() req: any, @Body('teamId') teamId: string) { return this.warSvc.joinTeam(req.user.id, teamId); }

  @Get('war/my-team')
  async warMyTeam(@Request() req: any) {
    const result = await this.warSvc.getMyTeam(req.user.id);
    return result || {};
  }

  @Post('war/settle')
  async warSettle() { return this.warSvc.settleWeek(); }
}
