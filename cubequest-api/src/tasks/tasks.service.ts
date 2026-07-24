
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getTodayTasks(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await this.prisma.task.findMany({ where: { active: true } });
    const records = await this.prisma.taskRecord.findMany({
      where: { userId, date: { gte: today, lt: tomorrow } },
    });

    return tasks.map((task) => {
      const record = records.find((r) => r.taskId === task.id);
      return {
        id: task.id,
        title: task.title,
        type: task.type,
        targetValue: task.targetValue,
        rewardExp: task.rewardExp,
        progress: record?.progress || 0,
        completed: record?.completed || false,
      };
    });
  }

  async updateProgress(userId: string, taskId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await this.prisma.taskRecord.findFirst({
      where: { userId, taskId, date: today },
    });

    if (record) {
      return this.prisma.taskRecord.update({
        where: { id: record.id },
        data: { progress: record.progress + 1 },
      });
    }

    return this.prisma.taskRecord.create({
      data: { userId, taskId, progress: 1, date: today },
    });
  }
}
