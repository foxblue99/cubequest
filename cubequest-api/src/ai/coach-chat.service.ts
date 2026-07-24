import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoachCoreService } from './coach-core.service';
import { MemoryService } from './memory.service';
import { ProfileAnalyzer } from './profile-analyzer.service';

@Injectable()
export class CoachChatService {
  constructor(
    private prisma: PrismaService,
    private core: CoachCoreService,
    private memory: MemoryService,
    private analyzer: ProfileAnalyzer,
  ) {}

  async coachChat(userId: string, message: string) {
    const [data, mem, profile] = await Promise.all([
      this.core.getUserData(userId),
      this.memory.getContext(userId),
      this.analyzer.userContext(userId),
    ]);

    // Load persona preference
    const personaMem = await this.memory.recall(userId, 'persona', 1);
    const persona = personaMem?.[0]?.content || '';
    const personaMap: Record<string, string> = {
      gentle: '你是温柔学姐型教练——用鼓励、温暖、耐心的语气。多用"慢慢来"、"你已经很棒了"、"再试一次就好"。',
      strict: '你是魔鬼教练——用直接、严厉、不废话的语气。只说关键问题，不拐弯抹角。可以偶尔毒舌但出发点是好。',
      bro: '你是损友型教练——用兄弟/哥们语气，轻松幽默，偶尔吐槽。用"兄弟"、"冲"、"淦"这种词。像好朋友陪你训练。',
      roast: '你是毒舌损友型教练——说话犀利但不伤人，吐槽里藏着真知灼见。核心建议依然专业准确，但表达方式让人想翻白眼又忍不住笑。',
    };
    const personaPrompt = personaMap[persona] || '你是CubeQuest青少年魔方私教导师。自称教练，带emoji，简洁。';

    const sys = `${personaPrompt}\n了解学员一切信息：\n${profile}\n${mem}`;

    const reply = await this.core.ask(sys, message);

    if (message.includes('目标') || message.includes('想') || message.includes('瓶颈')) {
      await this.memory.upsert(userId, 'goal', message.slice(0, 200), 1);
    }
    if (reply.includes('弱点') || reply.includes('瓶颈')) {
      await this.memory.upsert(userId, 'weakness', reply.slice(0, 300), 1);
    }
    return { reply };
  }
}
