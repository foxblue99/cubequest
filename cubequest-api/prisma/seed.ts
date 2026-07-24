
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: { role: 'ADMIN', phone: '13800000001', passwordHash: adminHash, nickname: '管理员' },
  });

  const studentHash = await bcrypt.hash('123456', 10);
  const student = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: { role: 'STUDENT', phone: '13800000002', passwordHash: studentHash, nickname: '速拧少年', birthYear: 2013, city: '武汉' },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, level: 'NEWBIE', streakDays: 3 },
  });

  const parentHash = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: { role: 'PARENT', phone: '13800000003', passwordHash: parentHash, nickname: '智慧家长' },
  });

  const categories = [
    { name: '二阶魔方', icon: '2️⃣', subCategories: JSON.stringify(['入门基础','面先法','CLL','EG']) },
    { name: '三阶魔方', icon: '3️⃣', subCategories: JSON.stringify(['BEGINNER','CFOP_BASIC','SUB30','SUB20','F2L','OLL','PLL']) },
    { name: '四阶魔方', icon: '4️⃣', subCategories: JSON.stringify(['入门基础','Yau方法','进阶提速']) },
    { name: '五阶魔方', icon: '5️⃣', subCategories: JSON.stringify(['入门基础','进阶']) },
    { name: '金字塔魔方', icon: '🔺', subCategories: JSON.stringify(['入门基础','Keyhole','L4E']) },
    { name: '斜转魔方', icon: '💎', subCategories: JSON.stringify(['入门基础','进阶']) },
    { name: '镜面魔方', icon: '🪞', subCategories: JSON.stringify(['入门基础']) },
    { name: '枫叶魔方', icon: '🍁', subCategories: JSON.stringify(['入门基础']) },
    { name: 'SQ1魔方', icon: '🔲', subCategories: JSON.stringify(['入门基础']) },
  ];
  for (const cat of categories) {
    await prisma.courseCategory.create({ data: cat });
  }

  const courses = [
    { title: '零基础入门', summary: '从认识魔方到完成第一次还原', mainCategory: '三阶魔方', category: 'BEGINNER', level: 'NEWBIE', sortOrder: 1 },
    { title: '三阶 CFOP 基础', summary: '学习 CFOP 方法的核心思想', mainCategory: '三阶魔方', category: 'CFOP_BASIC', level: 'BEGINNER', sortOrder: 2 },
    { title: 'Sub30 提速训练', summary: '突破 30 秒大关的系统训练', mainCategory: '三阶魔方', category: 'SUB30', level: 'SUB30', sortOrder: 3 },
    { title: 'F2L 入门专项', summary: '深入掌握 F2L 配对技巧', mainCategory: '三阶魔方', category: 'F2L', level: 'SUB30', sortOrder: 4 },
    { title: '二步 OLL', summary: '学习 OLL 分步解法', mainCategory: '三阶魔方', category: 'OLL', level: 'SUB30', sortOrder: 5 },
    { title: '二步 PLL', summary: '掌握 PLL 核心公式', mainCategory: '三阶魔方', category: 'PLL', level: 'SUB30', sortOrder: 6 },
  ];
  for (const c of courses) {
    const course = await prisma.course.create({ data: { ...c, published: true } });
    await prisma.lesson.createMany({ data: [
      { courseId: course.id, title: `${c.title} - 第1课`, type: 'ARTICLE', content: `# ${c.title}\n\n本课将带你入门${c.title}。`, sortOrder: 1, published: true },
      { courseId: course.id, title: `${c.title} - 第2课`, type: 'INTERACTIVE', content: '# 互动练习\n\n完成打乱还原并计时训练。', cubeMoves: "R U R' U'", sortOrder: 2, published: true },
      { courseId: course.id, title: `${c.title} - 第3课`, type: 'QUIZ', content: '# 测试\n\n检验学习成果。', sortOrder: 3, published: true },
    ]});
  }

  const formulas = [
    { name: 'Ua Perm', category: 'PLL', moves: "R U' R U R U R U' R' U' R2", difficulty: 2, sortOrder: 1 },
    { name: 'Ub Perm', category: 'PLL', moves: "R2 U R U R' U' R' U' R' U R'", difficulty: 2, sortOrder: 2 },
    { name: 'T Perm', category: 'PLL', moves: "R U R' U' R' F R2 U' R' U' R U R' F'", difficulty: 3, sortOrder: 3 },
    { name: 'Y Perm', category: 'PLL', moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'", difficulty: 3, sortOrder: 4 },
    { name: '小鱼 1', category: 'OLL', moves: "R U R' U R U2 R'", difficulty: 1, sortOrder: 1 },
    { name: '小鱼 2', category: 'OLL', moves: "R' U' R U' R' U2 R", difficulty: 1, sortOrder: 2 },
    { name: '十字翻棱', category: 'OLL', moves: "F R U R' U' F'", difficulty: 1, sortOrder: 3 },
    { name: '基础配对 1', category: 'F2L', moves: "R U R'", difficulty: 1, sortOrder: 1 },
    { name: '基础配对 2', category: 'F2L', moves: "U R U' R'", difficulty: 1, sortOrder: 2 },
    { name: '底层十字基础', category: 'CROSS', moves: "R' D' R D", difficulty: 1, sortOrder: 1 },
    { name: '入门手法 S1', category: 'LBL', moves: "R U R' U'", difficulty: 1, sortOrder: 1 },
    { name: '入门手法 S2', category: 'LBL', moves: "U R U' R' U' F' U F", difficulty: 1, sortOrder: 2 },
  ];
  for (const f of formulas) { await prisma.formula.create({ data: { ...f, published: true } }); }

  const tasks = [
    { title: '完成 5 次计时', type: 'SOLVE_COUNT', targetValue: 5, rewardExp: 10 },
    { title: '完成 1 次 ao5', type: 'AO5_COUNT', targetValue: 1, rewardExp: 20 },
    { title: '学习 1 节课程', type: 'LESSON_COMPLETE', targetValue: 1, rewardExp: 15 },
    { title: '练习 3 个公式', type: 'FORMULA_PRACTICE', targetValue: 3, rewardExp: 15 },
  ];
  for (const t of tasks) { await prisma.task.create({ data: t }); }

  const achievements = [
    { code: 'FIRST_SOLVE', title: '第一次还原', description: '完成第一次魔方还原' },
    { code: 'FIRST_SUB60', title: '第一次 Sub60', description: '单次成绩突破 60 秒' },
    { code: 'FIRST_SUB30', title: '第一次 Sub30', description: '单次成绩突破 30 秒' },
    { code: 'FIRST_SUB20', title: '第一次 Sub20', description: '单次成绩突破 20 秒' },
    { code: 'STREAK_7', title: '连续训练 7 天', description: '连续 7 天进行训练' },
    { code: 'FIRST_AO5', title: '首次完成 ao5', description: '完成第一次 ao5 平均' },
    { code: 'LEARN_F2L', title: '首次学习 F2L', description: '完成 F2L 第一课' },
    { code: 'MASTER_PLL', title: '首次掌握 PLL', description: '掌握第一个 PLL 公式' },
  ];
  for (const a of achievements) { await prisma.achievement.create({ data: a }); }

  const events = [
    { title: '2025 武汉魔方公开赛', type: 'COMPETITION', city: '武汉', address: '武汉国际会展中心', startDate: new Date('2025-09-15'), endDate: new Date('2025-09-16'), registerStart: new Date('2025-07-01'), registerEnd: new Date('2025-08-31'), status: 'REGISTERING', events: '333, 222, 444, OH, Pyraminx', description: '2025 年武汉魔方公开赛' },
    { title: '2025 北京魔方锦标赛', type: 'CHAMPIONSHIP', city: '北京', address: '国家会议中心', startDate: new Date('2025-10-20'), endDate: new Date('2025-10-22'), status: 'UPCOMING', events: '333, 444, 555, BLD, OH', description: '年度顶级魔方赛事' },
  ];
  for (const e of events) { await prisma.event.create({ data: e }); }

  console.log('Seed complete!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
