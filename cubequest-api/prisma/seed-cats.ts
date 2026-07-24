
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const cats = [
    { name: '二阶魔方', icon: '2️⃣', subCategories: '["入门基础","面先法","CLL","EG"]', sortOrder: 1 },
    { name: '三阶魔方', icon: '3️⃣', subCategories: '["BEGINNER","CFOP_BASIC","SUB30","SUB20","F2L","OLL","PLL"]', sortOrder: 2 },
    { name: '四阶魔方', icon: '4️⃣', subCategories: '["入门基础","Yau方法","进阶提速"]', sortOrder: 3 },
    { name: '五阶魔方', icon: '5️⃣', subCategories: '["入门基础","进阶"]', sortOrder: 4 },
    { name: '金字塔魔方', icon: '🔺', subCategories: '["入门基础","Keyhole","L4E"]', sortOrder: 5 },
    { name: '斜转魔方', icon: '💎', subCategories: '["入门基础","进阶"]', sortOrder: 6 },
    { name: '镜面魔方', icon: '🪞', subCategories: '["入门基础"]', sortOrder: 7 },
    { name: '枫叶魔方', icon: '🍁', subCategories: '["入门基础"]', sortOrder: 8 },
    { name: 'SQ1魔方', icon: '🔲', subCategories: '["入门基础"]', sortOrder: 9 },
  ];
  for (const c of cats) {
    // name no longer unique — skip if exists by name
    const existing = await p.courseCategory.findFirst({ where: { parentId: null, name: c.name } });
    if (!existing) await p.courseCategory.create({ data: c });
    else console.log('  skip (exists):', c.name);
  }
  const all = await p.courseCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log(`Done: ${all.length} categories`);
  await p.$disconnect();
}

main();
