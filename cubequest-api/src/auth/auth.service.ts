import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('手机号已注册');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        role: dto.role, phone: dto.phone, passwordHash,
        nickname: dto.nickname, birthYear: dto.birthYear, city: dto.city,
      },
    });

    if (dto.role === 'STUDENT') {
      await this.prisma.studentProfile.create({ data: { userId: user.id } });
    } else if (dto.role === 'PARENT') {
      await this.prisma.parentProfile.create({ data: { userId: user.id } });
    }
    await this.prisma.userProfile.create({ data: { userId: user.id } });
    await this.prisma.userGrowth.create({ data: { userId: user.id, level: 1, xp: 0, title: '新手' } });
    await this.prisma.eventTracking.create({
      data: { userId: user.id, event: 'REGISTER', metadata: JSON.stringify({ role: dto.role }) },
    });

    const tokens = this.generateTokens(user.id, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException('手机号或密码错误');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('手机号或密码错误');
    const tokens = this.generateTokens(user.id, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, parentProfile: true },
    });
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.sanitizeUser(user);
  }

  async updateAccount(userId: string, dto: { nickname?: string; city?: string }) {
    const data: any = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.city !== undefined) data.city = dto.city;
    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return this.sanitizeUser(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('用户不存在');
      const tokens = this.generateTokens(user.id, user.role);
      return { user: this.sanitizeUser(user), tokens };
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  private generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '2h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
