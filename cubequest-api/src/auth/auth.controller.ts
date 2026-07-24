import { Controller, Post, Body, Get, Patch, Req, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() @Post('register')
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Public() @Post('login')
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Get('me')
  getMe(@Request() req: any) { return this.authService.getMe(req.user.id); }

  @Patch('me')
  updateAccount(@Request() req: any, @Body() dto: UpdateAccountDto) {
    return this.authService.updateAccount(req.user.id, dto);
  }

  @Public() @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) { return this.authService.refresh(dto.refreshToken); }
}
