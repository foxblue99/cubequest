# 魔方远征 CubeQuest MVP 实施计划

> **For Hermes:** 使用 subagent 并行开发前后端，每完成一个模块验证一次。

**目标:** 根据《魔方远征 CubeQuest》开发文档 v1.0，构建完整的 MVP 平台。

**架构:** 前后端分离 — Next.js 15 App Router 前端 + NestJS 后端 + Prisma + SQLite(开发)/PostgreSQL(生产)。

**技术栈:** Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + Three.js + Zustand | NestJS 11 + Prisma + SQLite + JWT

---

## 阶段 1: 项目初始化 (并行)

### Task 1.1: 初始化 NestJS 后端
- 路径: `C:\Users\jj\cubequest\cubequest-api`
- 创建 NestJS 项目，配置 Prisma，写入完整 Schema
- 配置 JWT 认证模块

### Task 1.2: 初始化 Next.js 前端
- 路径: `C:\Users\jj\cubequest\cubequest-web`
- 创建 Next.js 15 App Router 项目
- 配置 Tailwind CSS 主题（深蓝冒险风格）
- 创建基础布局和路由结构

---

## 阶段 2: 后端核心 API

### Task 2.1: Prisma Schema + 认证系统
- 完整 Prisma Schema（User, Course, Lesson, Formula, SolveResult, Task, Achievement, Event, ParentChild 等）
- POST /api/auth/register, /api/auth/login, GET /api/auth/me
- JWT + Refresh Token

### Task 2.2: 课程 + 公式 API
- GET /api/courses, /api/courses/:id, /api/courses/:id/lessons
- GET /api/formulas, /api/formulas/:id
- CRUD 管理 API

### Task 2.3: 成绩 + 任务成就 + 赛事 + 家长 API
- POST /api/results, GET /api/results/me, GET /api/results/stats/me
- GET /api/tasks/today, POST /api/tasks/:id/progress
- GET /api/events, POST /api/parent/bind-*

### Task 2.4: 种子数据
- 6 门初始课程 + 示例课时
- PLL/OLL 示例公式
- 每日任务 + 成就
- 示例赛事

---

## 阶段 3: 前端核心页面

### Task 3.1: 通用组件 + 布局
- 深色主题导航栏 (Navbar)
- 用户状态卡 (UserStatusCard)
- API 客户端 (lib/api.ts)
- 认证状态管理 (Zustand)

### Task 3.2: 远征地图首页 (/)
- QuestMap 游戏化地图组件
- 地图节点状态展示
- 今日推荐区域

### Task 3.3: 课程中心 + 课程学习页
- /courses 课程列表 + 筛选
- /courses/:id 课程详情
- /courses/:id/lessons/:id 学习页面

### Task 3.4: 速拧训练 (/training/timer)
- WCA 风格打乱生成器
- 15 秒倒计时
- 空格/触屏计时交互
- 成绩保存 + ao5/ao12 即时计算
- 今日训练列表 + PB 展示

### Task 3.5: 公式库 (/formulas)
- 分类筛选 (F2L/OLL/PLL/Cross/LBL)
- 公式卡片 + 详情页
- 学习状态标记

---

## 阶段 4: 3D 魔方组件

### Task 4.1: Cube3D 组件
- React Three Fiber 实现 27 个小块
- 公式解析器 (U D L R F B / ' / 2)
- 旋转动画 (300ms)
- 播放控制 (播放/暂停/重置/打乱/速度)

---

## 阶段 5: 剩余前台 + 管理后台

### Task 5.1: 成绩中心 + 任务成就
- /results 成绩列表 + 统计图表 (Recharts)
- /tasks 每日任务
- /achievements 成就徽章墙

### Task 5.2: 赛事中心 + 家长中心 + 个人中心
- /events 赛事列表
- /parent 绑定 + 查看孩子报告
- /profile 个人信息

### Task 5.3: 管理后台
- /admin/* 路由
- 课程/公式/赛事/用户 CRUD

---

## 阶段 6: 验证 MVP 闭环

- 用户注册 → 进入远征地图 → 学课程 → 看 3D 公式 → 计时训练 → 保存成绩 → 看到 PB/ao5 → 完成任务 → 获得成就
