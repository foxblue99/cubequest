
import { Controller, Get, Param, Post, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { FormulasService } from './formulas.service';
import { Public } from '../auth/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('api/formulas')
export class FormulasController {
  constructor(private formulasService: FormulasService) {}

  @Public()
  @Get()
  findAll(@Query('category') category?: string, @Query('keyword') keyword?: string, @Query('level') level?: string) {
    return this.formulasService.findAll(category, keyword, level);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.formulasService.findOne(id, req.user?.id);
  }

  @Post(':id/progress')
  updateProgress(@Request() req: any, @Param('id') id: string, @Query('status') status: string) {
    return this.formulasService.updateProgress(req.user.id, id, status || 'LEARNING');
  }

  @Post(':id/favorite')
  favorite(@Request() req: any, @Param('id') id: string) {
    return this.formulasService.toggleFavorite(req.user.id, id);
  }

  @Delete(':id/favorite')
  unfavorite(@Request() req: any, @Param('id') id: string) {
    return this.formulasService.removeFavorite(req.user.id, id);
  }
}
