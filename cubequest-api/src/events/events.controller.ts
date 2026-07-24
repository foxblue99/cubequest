import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@Controller('api/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Public()
  @Get()
  findAll(@Query('city') city?: string, @Query('status') status?: string) {
    return this.eventsService.findAll(city, status);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // ── WCA Calendar ──
  @Public()
  @Get('calendar/list')
  getCalendar(@Query('city') city?: string, @Query('month') month?: string) {
    return this.eventsService.getCalendar(city, month);
  }

  // ── Local event admin ──
  @Roles('ADMIN')
  @Post('local-event')
  createLocalEvent(@Body() dto: any, @Request() req: any) {
    return this.eventsService.createLocalEvent(dto, req.user.id);
  }
}
