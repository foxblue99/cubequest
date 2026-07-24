
import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ParentService } from './parent.service';

@Controller('api/parent')
export class ParentController {
  constructor(private parentService: ParentService) {}

  @Post('bind-code/generate')
  generateBindCode(@Request() req: any) {
    return this.parentService.generateBindCode(req.user.id);
  }

  @Post('bind-child')
  bindChild(@Request() req: any, @Body() body: { bindCode: string }) {
    return this.parentService.bindChild(req.user.id, body.bindCode);
  }

  @Get('children')
  getChildren(@Request() req: any) {
    return this.parentService.getChildren(req.user.id);
  }

  @Get('children/:id/summary')
  getChildSummary(@Request() req: any, @Param('id') id: string) {
    return this.parentService.getChildSummary(req.user.id, id);
  }
}
