
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    return this.prisma.course.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      include: { lessons: { where: { published: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: { lessons: { where: { published: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getLessons(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId, published: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getLesson(lessonId: string) {
    return this.prisma.lesson.findUnique({ where: { id: lessonId } });
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error('Lesson not found');

    const existing = await this.prisma.courseProgress.findFirst({
      where: { userId, courseId: lesson.courseId },
    });

    if (existing) {
      await this.prisma.courseProgress.update({
        where: { id: existing.id },
        data: { lessonId, updatedAt: new Date() },
      });
    } else {
      await this.prisma.courseProgress.create({
        data: { userId, courseId: lesson.courseId, lessonId, progress: 1 },
      });
    }

    return { success: true };
  }

  async getMyProgress(userId: string) {
    return this.prisma.courseProgress.findMany({
      where: { userId },
      include: { 
        user: { select: { nickname: true } }
      },
    });
  }
}
