
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Users
  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { studentProfile: true },
      take: 100,
    });
    // Calculate tier for each user
    const enriched = await Promise.all(users.map(async u => {
      const pb = await this.prisma.solveResult.findFirst({
        where: { userId: u.id, finalTimeMs: { not: null } },
        orderBy: { finalTimeMs: 'asc' },
      });
      const postCount = await this.prisma.tribePost.count({ where: { userId: u.id } });
      const totalFlames = (await this.prisma.tribePost.aggregate({ where: { userId: u.id }, _sum: { flames: true } }))._sum.flames || 0;
      const contrib = postCount * 10 + totalFlames * 2;
      const pbSec = pb?.finalTimeMs ? pb.finalTimeMs / 1000 : 999;
      let tierName = '青铜魔士', tierIcon = '🥉';
      if (pbSec <= 10 || contrib >= 10000) { tierName = '传说魔神'; tierIcon = '🔮'; }
      else if (pbSec <= 15 || contrib >= 3000) { tierName = '钻石魔皇'; tierIcon = '👑'; }
      else if (pbSec <= 20 || contrib >= 1000) { tierName = '铂金魔圣'; tierIcon = '💎'; }
      else if (pbSec <= 30 || contrib >= 300) { tierName = '黄金魔尊'; tierIcon = '🥇'; }
      else if (pbSec <= 40 || contrib >= 100) { tierName = '白银魔师'; tierIcon = '🥈'; }
      return { ...u, tier: { name: tierName, icon: tierIcon }, pbMs: pb?.finalTimeMs || null, posts: postCount, totalFlames, contrib };
    }));
    return enriched;
  }

  async createUser(data: any) {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password || '123456', 10);
    const user = await this.prisma.user.create({
      data: {
        role: data.role || 'STUDENT',
        phone: data.phone,
        passwordHash,
        nickname: data.nickname || '新用户',
        birthYear: data.birthYear || null,
        city: data.city || null,
      },
    });
    if (data.role === 'STUDENT') {
      await this.prisma.studentProfile.create({ data: { userId: user.id } });
    } else if (data.role === 'PARENT') {
      await this.prisma.parentProfile.create({ data: { userId: user.id } });
    }
    return user;
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        role: data.role,
        nickname: data.nickname,
        phone: data.phone,
        city: data.city,
        birthYear: data.birthYear ? +data.birthYear : undefined,
      },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async resetPassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new Error('密码至少6位');
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  // Courses
  async getCourses() {
    return this.prisma.course.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { lessons: true },
    });
  }

  async createCourse(data: any) {
    return this.prisma.course.create({ data });
  }

  async updateCourse(id: string, data: any) {
    return this.prisma.course.update({ where: { id }, data });
  }

  async deleteCourse(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  // Lessons
  async getLessons() {
    return this.prisma.lesson.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createLesson(data: any) {
    return this.prisma.lesson.create({ data });
  }

  async updateLesson(id: string, data: any) {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async deleteLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }

  // Formulas
  async getFormulas() {
    return this.prisma.formula.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async createFormula(data: any) {
    return this.prisma.formula.create({ data });
  }

  async updateFormula(id: string, data: any) {
    return this.prisma.formula.update({ where: { id }, data });
  }

  async deleteFormula(id: string) {
    return this.prisma.formula.delete({ where: { id } });
  }

  // Events
  async getEvents() {
    return this.prisma.event.findMany({ orderBy: { startDate: 'desc' } });
  }

  async createEvent(data: any) {
    return this.prisma.event.create({ data });
  }

  async updateEvent(id: string, data: any) {
    return this.prisma.event.update({ where: { id }, data });
  }

  async deleteEvent(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  // Dashboard
  async getDashboard() {
    const [totalUsers, totalCourses, totalFormulas, totalResults, totalEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.formula.count(),
      this.prisma.solveResult.count(),
      this.prisma.event.count(),
    ]);
    return { totalUsers, totalCourses, totalFormulas, totalResults, totalEvents };
  }

  // Categories
  async getCategories() {
    return this.prisma.courseCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createCategory(data: any) {
    return this.prisma.courseCategory.create({ data });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.courseCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    return this.prisma.courseCategory.delete({ where: { id } });
  }

  // ── 部落管理 ──
  async getTribePosts(page = 1) {
    return this.prisma.tribePost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30, skip: (page-1)*30,
      include: { user: { select: { nickname: true } }, _count: { select: { comments: true, flamesRel: true } } },
    });
  }
  async deleteTribePost(id: string) {
    return this.prisma.tribePost.delete({ where: { id } });
  }
  async togglePin(id: string) {
    const p = await this.prisma.tribePost.findUnique({ where: { id } });
    return this.prisma.tribePost.update({ where: { id }, data: { pinned: !p?.pinned } });
  }
  async getTribeComments(page = 1) {
    return this.prisma.tribeComment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30, skip: (page-1)*30,
      include: { user: { select: { nickname: true } }, post: { select: { id: true, content: true } } },
    });
  }
  async deleteTribeComment(id: string) {
    return this.prisma.tribeComment.delete({ where: { id } });
  }

  // ── 上传文件管理 ──
  async getUploads() {
    const fs = await import('fs/promises');
    const path = await import('path');
    const dir = path.join(__dirname, '..', '..', '..', 'uploads');
    const files = await fs.readdir(dir);
    const stats = await Promise.all(files.map(async f => {
      const s = await fs.stat(path.join(dir, f));
      return { name: f, size: s.size, mtime: s.mtime };
    }));
    return stats.sort((a,b)=>b.mtime.getTime()-a.mtime.getTime());
  }
  async deleteUpload(filename: string) {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.unlink(path.join(__dirname, '..', '..', '..', 'uploads', filename));
    return { deleted: true };
  }
}
