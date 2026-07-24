
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const records = [
    { cubeType:'三阶魔方', eventName:'单次', timeMs:3470, timeFormatted:'3.47s', holderName:'王艺衡', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Yusheng', holderBio:'中国魔方天才少年，2023年打破三阶单次世界纪录。', holderNation:'🇨🇳', sortOrder:1, videoUrl:'https://example.com/wr-3x3.mp4', formulaReview:'R U R\' U\' ... (CFOP解法)' },
    { cubeType:'三阶魔方', eventName:'平均', timeMs:4540, timeFormatted:'4.54s', holderName:'Max Park', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Max', holderBio:'美国魔方传奇，多项世界纪录保持者。', holderNation:'🇺🇸', sortOrder:2, videoUrl:'https://example.com/wr-3x3-avg.mp4', formulaReview:'CFOP + X-Cross' },
    { cubeType:'二阶魔方', eventName:'单次', timeMs:430, timeFormatted:'0.43s', holderName:'Teodor Zajder', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Teodor', holderBio:'波兰二阶魔方天才。', holderNation:'🇵🇱', sortOrder:3 },
    { cubeType:'四阶魔方', eventName:'单次', timeMs:16960, timeFormatted:'16.96s', holderName:'Max Park', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Max4', holderBio:'美国魔方传奇，四阶单次世界纪录。', holderNation:'🇺🇸', sortOrder:4, videoUrl:'https://example.com/wr-4x4.mp4' },
    { cubeType:'金字塔', eventName:'单次', timeMs:700, timeFormatted:'0.70s', holderName:'Simon Kellum', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Simon', holderBio:'美国金字塔魔方顶尖速拧选手。', holderNation:'🇺🇸', sortOrder:5 },
    { cubeType:'斜转', eventName:'单次', timeMs:860, timeFormatted:'0.86s', holderName:'Carter Kucala', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Carter', holderBio:'美国斜转大师。', holderNation:'🇺🇸', sortOrder:6 },
    { cubeType:'五阶魔方', eventName:'单次', timeMs:33420, timeFormatted:'33.42s', holderName:'Max Park', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Max5', holderBio:'美国魔方传奇，五阶单次世界纪录。', holderNation:'🇺🇸', sortOrder:7 },
    { cubeType:'SQ1', eventName:'单次', timeMs:3530, timeFormatted:'3.53s', holderName:'Ryan Pilat', holderAvatar:'https://api.dicebear.com/9.x/avataaars/svg?seed=Ryan', holderBio:'美国SQ1魔方顶尖选手。', holderNation:'🇺🇸', sortOrder:9 },
  ];

  for (const r of records) {
    const existing = await p.worldRecord.findFirst({ where: { cubeType: r.cubeType, eventName: r.eventName } });
    if (!existing) { await p.worldRecord.create({ data: r }); console.log('created:', r.holderName, r.cubeType, r.timeFormatted); }
    else console.log('skip:', r.holderName);
  }
  console.log('Records seeded:', records.length);
}

main().then(()=>p.$disconnect());
