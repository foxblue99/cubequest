import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function dailySeed(): string { const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

function generateDailyScramble(): string {
  const moves = ['U','D','L','R','F','B'], mods = ['','2',"\'"];
  let s='', last='', seed=parseInt(dailySeed().replace(/-/g,''))%100000;
  for(let i=0;i<22;i++){
    let m; do { seed=(seed*16807)%2147483647; m=moves[seed%6]; } while(m===last);
    last=m; seed=(seed*16807)%2147483647; s+=m+mods[seed%3]+' ';
  }
  return s.trim();
}

@Injectable()
export class DailyChallengeService {
  constructor(private prisma: PrismaService) {}

  async getToday() {
    const scramble = generateDailyScramble();
    const dKey = `daily_${dailySeed()}`;

    // Simple leaderboard from eventEntry
    const entries = await this.prisma.eventEntry.findMany({
      where: { eventId: dKey },
      orderBy: { finalBest: 'asc' },
      take: 20,
    });

    const userIds = [...new Set(entries.map(e=>e.userId))];
    let userMap = new Map<string,string>();
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id:true, nickname:true } });
      userMap = new Map(users.map(u=>[u.id,u.nickname||'--']));
    }

    return {
      scramble,
      date: new Date().toLocaleDateString('zh-CN'),
      leaderboard: entries.map((e,i)=>({
        rank:i+1,
        nickname: userMap.get(e.userId)||'--',
        best: e.finalBest?(e.finalBest/1000).toFixed(2)+'s':'DNF',
      })),
    };
  }

  async submit(userId: string, timeMs: number, penalty = 'NONE') {
    const finalTimeMs = penalty==='DNF'?null:penalty==='PLUS_TWO'?timeMs+2000:timeMs;
    const dKey = `daily_${dailySeed()}`;

    await this.prisma.eventEntry.upsert({
      where: { eventId_userId: { eventId: dKey, userId } },
      update: { finalBest: finalTimeMs, results: JSON.stringify([{timeMs,penalty}]), status:'COMPETING' },
      create: { eventId: dKey, userId, finalBest: finalTimeMs, results: JSON.stringify([{timeMs,penalty}]), status:'COMPETING' },
    });

    return this.getToday();
  }
}
